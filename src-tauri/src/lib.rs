pub mod commands;
pub mod core;
pub mod error;
pub mod native;

use tauri::Builder;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_os::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::Webview,
                ))
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::LogDir {
                        file_name: Some("logs".to_string()),
                    },
                ))
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
