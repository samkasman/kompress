// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::PathBuf;
use std::process::Command;
use tauri::Manager;

fn get_ffmpeg_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    // In production, Tauri puts externalBin in Contents/MacOS/ (same as the main binary)
    // The binary name is just "ffmpeg" (or "ffmpeg.exe" on Windows)
    let exe_dir = app
        .path()
        .resource_dir()
        .map_err(|e| format!("Failed to get resource dir: {}", e))?
        .parent()
        .ok_or("No parent directory")?
        .join("MacOS");

    let ffmpeg_in_macos = if cfg!(target_os = "windows") {
        exe_dir.join("ffmpeg.exe")
    } else {
        exe_dir.join("ffmpeg")
    };

    if ffmpeg_in_macos.exists() {
        return Ok(ffmpeg_in_macos);
    }

    // Also check next to the executable directly
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            let ffmpeg_next_to_exe = if cfg!(target_os = "windows") {
                exe_dir.join("ffmpeg.exe")
            } else {
                exe_dir.join("ffmpeg")
            };
            if ffmpeg_next_to_exe.exists() {
                return Ok(ffmpeg_next_to_exe);
            }
        }
    }

    // In development, fall back to system ffmpeg
    #[cfg(debug_assertions)]
    {
        if Command::new("ffmpeg").arg("-version").output().is_ok() {
            return Ok(PathBuf::from("ffmpeg"));
        }
    }

    Err("FFmpeg binary not found".to_string())
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

#[tauri::command]
async fn compress_file(
    app: tauri::AppHandle,
    input_path: String,
    file_type: String,
) -> Result<String, String> {
    let ffmpeg_path = get_ffmpeg_path(&app)?;
    let output_path = get_output_path(&input_path, &file_type)?;

    let output = if file_type == "image" {
        // Image compression: convert to JPG with quality 85
        // -q:v 2-5 is roughly equivalent to quality 85 in other tools
        Command::new(&ffmpeg_path)
            .args([
                "-y",              // Overwrite output
                "-i", &input_path, // Input file
                "-q:v", "2",       // Quality (2 = high quality, ~85%)
                &output_path,      // Output file
            ])
            .output()
            .map_err(|e| format!("Failed to run FFmpeg: {}", e))?
    } else {
        // Video compression: H.264, CRF 22, medium preset
        Command::new(&ffmpeg_path)
            .args([
                "-y",                // Overwrite output
                "-i", &input_path,   // Input file
                "-c:v", "libx264",   // H.264 codec
                "-preset", "medium", // Encoding speed/quality trade-off
                "-crf", "22",        // Quality (lower = better, 22 is good balance)
                "-c:a", "aac",       // AAC audio codec
                "-b:a", "128k",      // Audio bitrate
                &output_path,        // Output file
            ])
            .output()
            .map_err(|e| format!("Failed to run FFmpeg: {}", e))?
    };

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("FFmpeg error: {}", stderr));
    }

    Ok(output_path)
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
