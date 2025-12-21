// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;
#[cfg(target_os = "linux")]
use std::path::PathBuf;

#[tauri::command]
async fn compress_file(input_path: String, file_type: String) -> Result<String, String> {
    use std::env;
    use std::path::Path;
    
    // Get the current directory and find the project root
    let current_dir = env::current_dir()
        .map_err(|e| format!("Failed to get current directory: {}", e))?;
    
    // In dev mode, current_dir might be src-tauri, so check for backend folder
    let project_root = if current_dir.join("backend").exists() {
        current_dir.clone()
    } else if current_dir.parent().map(|p| p.join("backend").exists()).unwrap_or(false) {
        current_dir.parent().unwrap().to_path_buf()
    } else {
        current_dir.clone()
    };
    
    let backend_script = project_root.join("backend").join("main.js");
    
    // Execute Node.js with the backend script
    let output = Command::new("node")
        .arg(backend_script.to_str().unwrap())
        .arg(&input_path)
        .arg(&file_type)
        .current_dir(&project_root)
        .output()
        .map_err(|e| format!("Failed to execute Node.js: {}. Make sure Node.js is installed.", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    
    if !output.status.success() {
        return Err(format!("Node.js error: {}", if !stderr.is_empty() { stderr } else { stdout }));
    }
    
    // Parse JSON response
    match serde_json::from_str::<serde_json::Value>(&stdout) {
        Ok(json_value) => {
            if json_value["success"].as_bool().unwrap_or(false) {
                Ok(json_value["result"].as_str().unwrap().to_string())
            } else {
                Err(json_value["error"].as_str().unwrap_or("Unknown error").to_string())
            }
        }
        Err(_) => {
            // If not JSON, assume it's a direct path (fallback)
            let trimmed = stdout.trim();
            if !trimmed.is_empty() && !trimmed.contains("error") {
                Ok(trimmed.to_string())
            } else {
                Err(format!("Failed to parse output: {}", stdout))
            }
        }
    }
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

