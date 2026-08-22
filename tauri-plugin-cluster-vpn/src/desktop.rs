use serde::de::DeserializeOwned;
use tauri::{plugin::PluginApi, AppHandle, Runtime};

use crate::models::*;
use crate::Error;

pub fn init<R: Runtime, C: DeserializeOwned>(
  app: &AppHandle<R>,
  _api: PluginApi<R, C>,
) -> crate::Result<ClusterVpn<R>> {
  Ok(ClusterVpn(app.clone()))
}

/// Access to the cluster-vpn APIs.
pub struct ClusterVpn<R: Runtime>(AppHandle<R>);

impl<R: Runtime> ClusterVpn<R> {
  pub fn start(&self, _payload: VpnStartRequest) -> crate::Result<VpnStatus> {
    Err(Error::Message(
      "Android VpnService is not available on desktop; use the desktop blocking backend".into(),
    ))
  }

  pub fn stop(&self) -> crate::Result<VpnStatus> {
    Ok(VpnStatus {
      state: "off".into(),
      domains: Vec::new(),
    })
  }

  pub fn status(&self) -> crate::Result<VpnStatus> {
    Ok(VpnStatus {
      state: "unsupported".into(),
      domains: Vec::new(),
    })
  }
}
