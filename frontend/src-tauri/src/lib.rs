use std::path::PathBuf;
use std::fs;
use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;

async fn get_db_path() -> Result<PathBuf, String> {
    let os = std::env::consts::OS;
    
    // Using dirs crate for reliable home directory resolution
    let home = dirs::home_dir().ok_or("Could not find home directory")?;
    
    let app_dir = if os == "windows" {
        let local_app_data = std::env::var("LOCALAPPDATA").map(PathBuf::from).map_err(|_| "Could not find LOCALAPPDATA environment variable")?;
        local_app_data.join("MarketOS")
    } else if os == "macos" {
        home.join("Library/Application Support/MarketOS")
    } else {
        home.join(".marketos")
    };
    
    Ok(app_dir.join("market_db.mv.db"))
}

#[tauri::command]
async fn export_database(app: AppHandle) -> Result<(), String> {
    let db_path = get_db_path().await?;
    
    if !db_path.exists() {
        return Err("Database file not found. It might not have been created yet. Try performing some actions in the app first.".to_string());
    }

    let file_path = app.dialog()
        .file()
        .set_file_name("market_db_backup.mv.db")
        .add_filter("H2 Database", &["db"])
        .blocking_save_file();

    if let Some(path) = file_path {
        let dest = path.into_path().map_err(|_| "Invalid destination path")?;
        fs::copy(&db_path, &dest).map_err(|e| format!("Failed to copy database: {}", e))?;
        Ok(())
    } else {
        Err("Export cancelled".to_string())
    }
}

#[tauri::command]
async fn import_database(app: AppHandle) -> Result<(), String> {
    let db_path = get_db_path().await?;
    let app_dir = db_path.parent().ok_or("Could not find app directory")?;

    let file_path = app.dialog()
        .file()
        .add_filter("H2 Database", &["db"])
        .blocking_pick_file();

    if let Some(path) = file_path {
        let src = path.into_path().map_err(|_| "Invalid source path")?;
        
        if !app_dir.exists() {
            fs::create_dir_all(app_dir).map_err(|e| format!("Failed to create app directory: {}", e))?;
        }

        // Note: This might fail if the sidecar has the file locked.
        fs::copy(&src, &db_path).map_err(|e| {
            if e.kind() == std::io::ErrorKind::PermissionDenied {
                "Failed to import database: Permission denied. The database file may be in use. Please try closing the application and trying again, or ensure the backend is not running.".to_string()
            } else {
                format!("Failed to import database: {}", e)
            }
        })?;
        Ok(())
    } else {
        Err("Import cancelled".to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![export_database, import_database])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
