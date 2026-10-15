use crate::core::{clusters, firewall};
use crate::error::AppResult;
use tauri::AppHandle;

#[tauri::command]
pub async fn update_firewall_rules(
    app: AppHandle,
    region_id: String,
    blocked_domains: Vec<String>,
    enable: bool,
) -> AppResult<String> {
    let data = clusters::load(&app).await;
    tauri::async_runtime::spawn_blocking(move || {
        firewall::update_for_region(&data, &region_id, &blocked_domains, enable)
    })
    .await
    .map_err(|e| crate::error::AppError::Msg(format!("firewall worker: {e}")))?
}

#[tauri::command]
pub async fn clear_firewall_rules() -> AppResult<String> {
    tauri::async_runtime::spawn_blocking(firewall::clear_all)
        .await
        .map_err(|e| crate::error::AppError::Msg(format!("firewall worker: {e}")))?
}

#[tauri::command]
pub fn get_firewall_rules() -> AppResult<Vec<String>> {
    firewall::list_ours()
}
