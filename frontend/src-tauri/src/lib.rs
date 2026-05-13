use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, Manager, State};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_shell::{process::CommandChild, ShellExt};

const SIDECAR_NAME: &str = "spring-backend";

struct SidecarState(Mutex<Option<CommandChild>>);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(SidecarState(Mutex::new(None)))
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![export_database, import_database])
        .setup(|app| {
            // Manually start the sidecar so we have a handle to it in our State
            start_sidecar(&app.handle())?;

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

fn start_sidecar(app: &AppHandle) -> Result<(), String> {
    let sidecar_state = app
        .try_state::<SidecarState>()
        .ok_or("Sidecar state not initialized")?;

    let mut lock = sidecar_state.0.lock().unwrap();

    // Ensure any existing process is cleaned up
    if let Some(child) = lock.take() {
        let _ = child.kill();
    }

    // Use the constant to ensure names match exactly
    let (_rx, child) = app
        .shell()
        .sidecar(SIDECAR_NAME)
        .map_err(|e| format!("Sidecar configuration error: {}", e))?
        .spawn()
        .map_err(|e| format!("Failed to spawn sidecar binary: {}", e))?;

    *lock = Some(child);
    Ok(())
}

async fn get_db_path() -> Result<PathBuf, String> {
    let os = std::env::consts::OS;
    let home = dirs::home_dir().ok_or("Could not find home directory")?;

    let app_dir = if os == "windows" {
        let local_app_data = std::env::var("LOCALAPPDATA")
            .map(PathBuf::from)
            .map_err(|_| "Could not find LOCALAPPDATA environment variable")?;
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
        return Err("Database file not found.".to_string());
    }

    let file_path = app
        .dialog()
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
async fn import_database(app: AppHandle, state: State<'_, SidecarState>) -> Result<(), String> {
    let db_path = get_db_path().await?;
    let app_dir = db_path.parent().ok_or("Could not find app directory")?;

    let file_path = app
        .dialog()
        .file()
        .add_filter("H2 Database", &["db"])
        .blocking_pick_file();

    if let Some(path) = file_path {
        let src = path.into_path().map_err(|_| "Invalid source path")?;

        // 1. Kill the sidecar process to release the file lock
        {
            let mut lock = state.0.lock().unwrap();
            if let Some(child) = lock.take() {
                let _ = child.kill();
                // Give the OS 500ms to fully close the file handle
                std::thread::sleep(std::time::Duration::from_millis(500));
            }
        }

        if !app_dir.exists() {
            fs::create_dir_all(app_dir)
                .map_err(|e| format!("Failed to create directory: {}", e))?;
        }

        // 2. Overwrite the database
        fs::copy(&src, &db_path).map_err(|e| format!("Import failed: {}", e))?;

        // 3. Restart the sidecar
        start_sidecar(&app)?;

        Ok(())
    } else {
        Err("Import cancelled".to_string())
    }
}
