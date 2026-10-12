use crate::core::net;
use crate::error::AppResult;

#[tauri::command]
pub async fn ping_server(
    hostname: String,
    timeout_ms: Option<u64>,
    _port: Option<u16>,
    _addresses: Option<Vec<String>>,
) -> AppResult<serde_json::Value> {
    let hostname = hostname.clone();
    tauri::async_runtime::spawn_blocking(move || net::ping_host(&hostname, timeout_ms))
        .await
        .map_err(|e| crate::error::AppError::Msg(format!("ping worker: {e}")))?
}

#[tauri::command]
pub async fn debug_network(hostname: String) -> AppResult<serde_json::Value> {
    tauri::async_runtime::spawn_blocking(move || net::debug_network(&hostname))
        .await
        .map_err(|e| crate::error::AppError::Msg(format!("debug worker: {e}")))?
}
