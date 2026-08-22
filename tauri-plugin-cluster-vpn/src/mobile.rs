use serde::de::DeserializeOwned;
use tauri::{
  plugin::{PluginApi, PluginHandle},
  AppHandle, Runtime,
};

use crate::models::*;

#[cfg(target_os = "ios")]
tauri::ios_plugin_binding!(init_plugin_cluster_vpn);

// initializes the Kotlin or Swift plugin classes
pub fn init<R: Runtime, C: DeserializeOwned>(
  _app: &AppHandle<R>,
  api: PluginApi<R, C>,
) -> crate::Result<ClusterVpn<R>> {
  #[cfg(target_os = "android")]
  let handle = api.register_android_plugin(
    "com.aysi.clusterbanned.vpn",
    "ClusterVpnPlugin",
  )?;
  #[cfg(target_os = "ios")]
  let handle = api.register_ios_plugin(init_plugin_cluster_vpn)?;
  Ok(ClusterVpn(handle))
}

/// Access to the cluster-vpn APIs.
pub struct ClusterVpn<R: Runtime>(PluginHandle<R>);

impl<R: Runtime> ClusterVpn<R> {
  pub fn start(&self, payload: VpnStartRequest) -> crate::Result<VpnStatus> {
    self
      .0
      .run_mobile_plugin("start", payload)
      .map_err(Into::into)
  }

  pub fn stop(&self) -> crate::Result<VpnStatus> {
    self.0.run_mobile_plugin("stop", ()).map_err(Into::into)
  }

  pub fn status(&self) -> crate::Result<VpnStatus> {
    self.0.run_mobile_plugin("status", ()).map_err(Into::into)
  }
}
