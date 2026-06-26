// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs::OpenOptions;
use std::io::{BufReader, ErrorKind, Read};
use std::path::PathBuf;
use std::process::{Command, Stdio};
use tauri::{Emitter, Manager};

fn get_ffmpeg_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    // Tauri bundles externalBin binaries in Contents/MacOS/ (macOS) or next to the exe (Windows/Linux)
    // The binary name is just "ffmpeg" (or "ffmpeg.exe" on Windows)
    let binary_name = if cfg!(target_os = "windows") {
        "ffmpeg.exe"
    } else {
        "ffmpeg"
    };

    // Try resource directory first (production bundle location)
    if let Ok(resource_dir) = app.path().resource_dir() {
        let ffmpeg_path = if cfg!(target_os = "macos") {
            // On macOS, externalBin goes in Contents/MacOS/
            resource_dir
                .parent()
                .ok_or("No parent directory")?
                .join("MacOS")
                .join(binary_name)
        } else {
            // On Windows/Linux, externalBin goes in the resource directory
            resource_dir.join(binary_name)
        };

        if ffmpeg_path.exists() {
            return Ok(ffmpeg_path);
        }
    }

    // Fallback: check next to the executable
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            let ffmpeg_path = exe_dir.join(binary_name);
            if ffmpeg_path.exists() {
                return Ok(ffmpeg_path);
            }
        }
    }

    // In development, fall back to system ffmpeg if available
    #[cfg(debug_assertions)]
    {
        if Command::new("ffmpeg").arg("-version").output().is_ok() {
            return Ok(PathBuf::from("ffmpeg"));
        }
    }

    Err("FFmpeg binary not found".to_string())
}

fn parse_duration(line: &str) -> Option<f64> {
    // Parse "Duration: 00:01:23.45" format
    if let Some(start) = line.find("Duration: ") {
        let start = start + 10;
        if let Some(end) = line[start..].find(',') {
            let duration_str = &line[start..start + end];
            // Parse HH:MM:SS.mmm
            let parts: Vec<&str> = duration_str.split(':').collect();
            if parts.len() == 3 {
                if let (Ok(hours), Ok(minutes), Ok(seconds)) = (
                    parts[0].parse::<f64>(),
                    parts[1].parse::<f64>(),
                    parts[2].parse::<f64>(),
                ) {
                    return Some(hours * 3600.0 + minutes * 60.0 + seconds);
                }
            }
        }
    }
    None
}

fn parse_progress(line: &str, duration: Option<f64>) -> Option<(f64, f64)> {
    // Parse "time=00:00:05.00" format
    if let Some(start) = line.find("time=") {
        let start = start + 5;
        if let Some(end) = line[start..].find(' ') {
            let time_str = &line[start..start + end];
            // Parse HH:MM:SS.mmm
            let parts: Vec<&str> = time_str.split(':').collect();
            if parts.len() == 3 {
                if let (Ok(hours), Ok(minutes), Ok(seconds)) = (
                    parts[0].parse::<f64>(),
                    parts[1].parse::<f64>(),
                    parts[2].parse::<f64>(),
                ) {
                    let current_time = hours * 3600.0 + minutes * 60.0 + seconds;
                    if let Some(dur) = duration {
                        return Some((current_time, dur));
                    }
                }
            }
        }
    }
    None
}

fn get_output_path(input_path: &str, file_type: &str) -> Result<String, String> {
    let path = PathBuf::from(input_path);
    let parent = path.parent().ok_or("No parent directory")?;
    let stem = path.file_stem().ok_or("No file stem")?.to_string_lossy();

    let ext = if file_type == "image" {
        "jpg"
    } else if file_type == "audio" {
        "mp3"
    } else {
        "mp4"
    };

    // Atomically reserve a unique path with O_CREAT|O_EXCL semantics to avoid
    // a TOCTOU race when multiple compressions of the same source run in
    // parallel. We create a 0-byte placeholder; ffmpeg's `-y` will overwrite.
    let mut counter = 0;
    loop {
        let candidate = if counter == 0 {
            parent.join(format!("{}-compressed.{}", stem, ext))
        } else {
            parent.join(format!("{}-compressed-{}.{}", stem, counter, ext))
        };
        match OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&candidate)
        {
            Ok(_) => return Ok(candidate.to_string_lossy().to_string()),
            Err(e) if e.kind() == ErrorKind::AlreadyExists => {
                counter += 1;
                continue;
            }
            Err(e) => return Err(format!("Failed to reserve output path: {}", e)),
        }
    }
}

#[derive(serde::Serialize, Clone)]
struct FfmpegOutput {
    file_id: String,
    line: String,
}

#[derive(serde::Serialize, Clone)]
struct FfmpegProgress {
    file_id: String,
    progress: u32, // 0-100
}

#[derive(serde::Serialize)]
struct CompressResult {
    output_path: String,
    output_size: u64,
}

#[tauri::command]
async fn compress_file(
    app: tauri::AppHandle,
    input_path: String,
    file_type: String,
    file_id: String,
    image_quality: Option<u8>,
    video_crf: Option<u8>,
    audio_bitrate: Option<u32>,
) -> Result<CompressResult, String> {
    let ffmpeg_path = get_ffmpeg_path(&app)?;
    let output_path = get_output_path(&input_path, &file_type)?;
    let output_path_clone = output_path.clone();

    let args: Vec<String> = if file_type == "image" {
        let quality = image_quality.unwrap_or(6).to_string();
        // -update 1 -frames:v 1: image2 muxer requires this when writing a single
        // still from a container that may hold multiple items (HEIF, AVIF, etc.)
        vec![
            "-y".to_string(),
            "-i".to_string(),
            input_path,
            "-update".to_string(),
            "1".to_string(),
            "-frames:v".to_string(),
            "1".to_string(),
            "-q:v".to_string(),
            quality,
            output_path,
        ]
    } else if file_type == "audio" {
        let bitrate = audio_bitrate.unwrap_or(320).to_string() + "k";
        vec![
            "-y".to_string(),
            "-i".to_string(),
            input_path,
            "-codec:a".to_string(),
            "libmp3lame".to_string(),
            "-b:a".to_string(),
            bitrate,
            output_path,
        ]
    } else {
        let crf = video_crf.unwrap_or(22).to_string();
        vec![
            "-y".to_string(),
            "-i".to_string(),
            input_path,
            "-c:v".to_string(),
            "libx264".to_string(),
            "-preset".to_string(),
            "medium".to_string(),
            "-crf".to_string(),
            crf,
            "-c:a".to_string(),
            "aac".to_string(),
            "-b:a".to_string(),
            "128k".to_string(),
            "-stats_period".to_string(),
            "0.5".to_string(),
            output_path,
        ]
    };

    let args_str: Vec<&str> = args.iter().map(|s| s.as_str()).collect();

    let mut child = Command::new(&ffmpeg_path)
        .args(&args_str)
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to run FFmpeg: {}", e))?;

    // Spawn thread to stream stderr and collect lines for error reporting
    let stderr = child.stderr.take().ok_or("Failed to capture FFmpeg stderr")?;
    let app_clone = app.clone();
    let file_id_clone = file_id.clone();
    let file_type_clone = file_type.clone();

    let stderr_thread = std::thread::spawn(move || {
        // FFmpeg writes progress stats separated by \r (overwriting the same
        // terminal line) and only emits \n at major status events. Splitting
        // on \n alone makes stats invisible until the next status event, so
        // we read byte-by-byte and treat \r OR \n as a line terminator.
        let mut reader = BufReader::new(stderr);
        let mut duration_seconds: Option<f64> = None;
        let mut lines_out: Vec<String> = Vec::new();
        let mut line_buf: Vec<u8> = Vec::with_capacity(256);
        let mut byte = [0u8; 1];

        let emit_line = |line: String,
                             lines_out: &mut Vec<String>,
                             duration_seconds: &mut Option<f64>| {
            lines_out.push(line.clone());

            let _ = app_clone.emit(
                "ffmpeg-output",
                FfmpegOutput {
                    file_id: file_id_clone.clone(),
                    line: line.clone(),
                },
            );

            if file_type_clone == "video" {
                if duration_seconds.is_none() {
                    if let Some(dur) = parse_duration(&line) {
                        *duration_seconds = Some(dur);
                    }
                }
                if let Some((current_time, dur)) =
                    parse_progress(&line, *duration_seconds)
                {
                    let progress = if dur > 0.0 {
                        ((current_time / dur) * 100.0).min(100.0) as u32
                    } else {
                        0
                    };
                    let _ = app_clone.emit(
                        "ffmpeg-progress",
                        FfmpegProgress {
                            file_id: file_id_clone.clone(),
                            progress,
                        },
                    );
                }
            }
        };

        loop {
            match reader.read(&mut byte) {
                Ok(0) => break,
                Ok(_) => {
                    let b = byte[0];
                    if b == b'\n' || b == b'\r' {
                        if !line_buf.is_empty() {
                            let line =
                                String::from_utf8_lossy(&line_buf).into_owned();
                            line_buf.clear();
                            emit_line(line, &mut lines_out, &mut duration_seconds);
                        }
                    } else {
                        line_buf.push(b);
                    }
                }
                Err(_) => break,
            }
        }
        if !line_buf.is_empty() {
            let line = String::from_utf8_lossy(&line_buf).into_owned();
            emit_line(line, &mut lines_out, &mut duration_seconds);
        }
        lines_out
    });

    let status = child.wait().map_err(|e| format!("FFmpeg process error: {}", e))?;
    let stderr_lines = stderr_thread.join().unwrap_or_default();

    if !status.success() {
        let _ = std::fs::remove_file(&output_path_clone);
        let detail = stderr_lines
            .iter()
            .rev()
            .find(|l| !l.trim().is_empty())
            .map(|l| format!(": {}", l.trim()))
            .unwrap_or_default();
        return Err(format!("FFmpeg failed{}", detail));
    }

    // Get output file size
    let output_size = std::fs::metadata(&output_path_clone)
        .map_err(|e| format!("Failed to get output file size: {}", e))?
        .len();

    Ok(CompressResult {
        output_path: output_path_clone,
        output_size,
    })
}

#[tauri::command]
async fn reveal_in_folder(path: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg("-R")
            .arg(&path)
            .output()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg("/select,")
            .arg(&path)
            .output()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        let path_buf = PathBuf::from(&path);
        let parent = path_buf.parent().ok_or("No parent directory")?;
        Command::new("xdg-open")
            .arg(parent)
            .output()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            compress_file,
            reveal_in_folder,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
