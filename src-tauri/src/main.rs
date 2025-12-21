// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::io::{BufRead, BufReader};
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

    let ext = if file_type == "image" { "jpg" } else { "mp4" };

    let mut output_path = parent.join(format!("{}-compressed.{}", stem, ext));
    let mut counter = 1;

    // Handle duplicate files
    while output_path.exists() {
        output_path = parent.join(format!("{}-compressed-{}.{}", stem, counter, ext));
        counter += 1;
    }

    Ok(output_path.to_string_lossy().to_string())
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
) -> Result<CompressResult, String> {
    let ffmpeg_path = get_ffmpeg_path(&app)?;
    let output_path = get_output_path(&input_path, &file_type)?;

    let args: Vec<&str> = if file_type == "image" {
        vec!["-y", "-i", &input_path, "-q:v", "6", &output_path]
    } else {
        vec![
            "-y", "-i", &input_path,
            "-c:v", "libx264",
            "-preset", "medium",
            "-crf", "22",
            "-c:a", "aac",
            "-b:a", "128k",
            "-stats_period", "0.5", // Update stats every 0.5 seconds
            &output_path,
        ]
    };

    let mut child = Command::new(&ffmpeg_path)
        .args(&args)
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to run FFmpeg: {}", e))?;

    // Stream stderr output in realtime and parse progress
    if let Some(stderr) = child.stderr.take() {
        let app_clone = app.clone();
        let file_id_clone = file_id.clone();
        let file_type_clone = file_type.clone();
        
        // Spawn thread to read stderr in background (blocking I/O)
        std::thread::spawn(move || {
            let reader = BufReader::new(stderr);
            let mut duration_seconds: Option<f64> = None;

            // Read lines and emit events
            for line in reader.lines() {
                if let Ok(line) = line {
                    // Emit output line
                    let _ = app_clone.emit("ffmpeg-output", FfmpegOutput {
                        file_id: file_id_clone.clone(),
                        line: line.clone(),
                    });

                    // Parse duration (for video files)
                    if file_type_clone == "video" && duration_seconds.is_none() {
                        if let Some(dur) = parse_duration(&line) {
                            duration_seconds = Some(dur);
                        }
                    }

                    // Parse progress (for video files)
                    if file_type_clone == "video" {
                        if let Some((current_time, dur)) = parse_progress(&line, duration_seconds) {
                            let progress = if dur > 0.0 {
                                ((current_time / dur) * 100.0).min(100.0) as u32
                            } else {
                                0
                            };
                            let _ = app_clone.emit("ffmpeg-progress", FfmpegProgress {
                                file_id: file_id_clone.clone(),
                                progress,
                            });
                        }
                    }
                }
            }
        });
    }

    let status = child.wait().map_err(|e| format!("FFmpeg process error: {}", e))?;

    if !status.success() {
        return Err("FFmpeg compression failed".to_string());
    }

    // Get output file size
    let output_size = std::fs::metadata(&output_path)
        .map_err(|e| format!("Failed to get output file size: {}", e))?
        .len();

    Ok(CompressResult {
        output_path,
        output_size,
    })
}

#[tauri::command]
async fn open_file(path: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&path)
            .output()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "windows")]
    {
        Command::new("cmd")
            .args(["/C", "start", "", &path])
            .output()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(&path)
            .output()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
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
        .invoke_handler(tauri::generate_handler![
            compress_file,
            open_file,
            reveal_in_folder
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
