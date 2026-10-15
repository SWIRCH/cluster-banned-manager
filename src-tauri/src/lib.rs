pub mod commands;
pub mod core;
pub mod error;
pub mod native;

use crate::core::clusters::cleanup_blocks;
use tauri::Builder;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    if std::env::args().any(|a| a == "--cleanup") {
        let result = tauri::async_runtime::block_on(cleanup_blocks(true));
        std::process::exit(if result.is_ok() { 0 } else { 1 });
    }

    Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_os::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(log::LevelFilter::Info)
                .build(),
        )
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_cluster_vpn::init())
        .invoke_handler(tauri::generate_handler![
            commands::net::ping_server,
            commands::net::debug_network,
            commands::hosts::read_blocked_domains,
            commands::hosts::check_hosts_consistency,
            commands::hosts::update_hosts_block,
            commands::cluster::get_clusters,
            commands::cluster::clear_cluster_blocks,
            commands::cluster::update_cluster_rules,
            commands::firewall::update_firewall_rules,
            commands::firewall::get_firewall_rules,
            commands::firewall::clear_firewall_rules,
            commands::settings::get_settings,
            commands::settings::save_settings,
            commands::process::is_process_running,
            commands::process::kill_process,
            commands::process::launch_game,
            commands::system::check_elevation,
            commands::system::get_app_info,
            commands::system::test_tauri,
            commands::vpn::vpn_prepare_policy
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
