use crate::core::settings::{self, Settings};
use crate::error::AppResult;

#[tauri::command]
pub fn get_settings() -> AppResult<Settings> {
    settings::load()
}

#[tauri::command]
pub fn save_settings(settings: Settings) -> AppResult<()> {
    settings::save(&settings)
}
