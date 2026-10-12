use crate::core::process;
use crate::error::AppResult;

#[tauri::command]
pub fn is_process_running(name: String) -> AppResult<bool> {
    Ok(process::is_running(&name))
}

#[tauri::command]
pub fn kill_process(name: String) -> AppResult<String> {
    process::kill(&name)
}

#[tauri::command]
pub fn launch_game(appid: String) -> AppResult<String> {
    process::launch_game(&appid)
}
