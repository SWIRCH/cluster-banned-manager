use crate::error::AppResult;
use crate::native::paths;
use serde_json::json;

#[tauri::command]
pub fn check_elevation() -> AppResult<serde_json::Value> {
    let path = paths::hosts_path()?;

    match std::fs::OpenOptions::new().append(true).open(&path) {
        Ok(_) => Ok(json!({ "isAdmin": true, "path": path.display().to_string() })),
        Err(e) => Ok(json!({
            "isAdmin": false,
            "path": path.display().to_string(),
            "error": e.to_string()
        })),
    }
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
