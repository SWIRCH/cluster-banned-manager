use tauri::{
  plugin::{Builder, TauriPlugin},
  Manager, Runtime,
};
use serde::Deserialize;

pub use models::*;

#[derive(Debug, Default, Deserialize)]
pub struct Config {}

#[cfg(desktop)]
mod desktop;
#[cfg(mobile)]
mod mobile;

mod commands;
mod error;
mod models;

pub use error::{Error, Result};

#[cfg(desktop)]
use desktop::ClusterVpn;
#[cfg(mobile)]
use mobile::ClusterVpn;

/// Extensions to [`tauri::App`], [`tauri::AppHandle`] and [`tauri::Window`] to access the cluster-vpn APIs.
pub trait ClusterVpnExt<R: Runtime> {
  fn cluster_vpn(&self) -> &ClusterVpn<R>;
}

impl<R: Runtime, T: Manager<R>> crate::ClusterVpnExt<R> for T {
  fn cluster_vpn(&self) -> &ClusterVpn<R> {
    self.state::<ClusterVpn<R>>().inner()
  }
}

/// Initializes the plugin.
pub fn init<R: Runtime>() -> TauriPlugin<R, Option<Config>> {
  Builder::<R, Option<Config>>::new("cluster-vpn")
    .invoke_handler(tauri::generate_handler![
      commands::start,
      commands::stop,
      commands::status,
    ])
    .setup(|app, api| {
      #[cfg(mobile)]
      let cluster_vpn = mobile::init(app, api)?;
      #[cfg(desktop)]
      let cluster_vpn = desktop::init(app, api)?;
      app.manage(cluster_vpn);
      Ok(())
    })
    .build()
}
