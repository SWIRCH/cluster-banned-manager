use tauri::{command, AppHandle, Runtime};

use crate::models::*;
use crate::Result;
use crate::ClusterVpnExt;

#[command]
pub(crate) async fn start<R: Runtime>(
    app: AppHandle<R>,
    payload: VpnStartRequest,
) -> Result<VpnStatus> {
    app.cluster_vpn().start(payload)
}

#[command]
pub(crate) async fn stop<R: Runtime>(app: AppHandle<R>) -> Result<VpnStatus> {
    app.cluster_vpn().stop()
}

#[command]
pub(crate) async fn status<R: Runtime>(app: AppHandle<R>) -> Result<VpnStatus> {
    app.cluster_vpn().status()
}
