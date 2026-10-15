use crate::core::process::process_is_elevated;
use crate::error::AppResult;
use crate::native::paths;
use serde_json::json;

#[tauri::command]
pub fn check_elevation() -> AppResult<serde_json::Value> {
    let path = paths::hosts_path()?;
    let is_admin = process_is_elevated();

    let (hosts_writable, error) = match std::fs::OpenOptions::new().append(true).open(&path) {
        Ok(_) => (true, None),
        Err(e) => (false, Some(e.to_string())),
    };

    Ok(json!({
        "isAdmin": is_admin,
        "hostsWritable": hosts_writable,
        "path": path.display().to_string(),
        "error": error,
    }))
}

#[tauri::command]
pub fn get_app_info() -> AppResult<serde_json::Value> {
    Ok(json!({
        "name": "WoT Blitz Cluster Banned Manager",
        "version": env!("CARGO_PKG_VERSION"),
        "tauri_version": "2.x",
        "platform": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
    }))
}

#[tauri::command]
pub fn test_tauri() -> AppResult<String> {
    Ok("Tauri backend is working correctly! ✅".to_string())
}
