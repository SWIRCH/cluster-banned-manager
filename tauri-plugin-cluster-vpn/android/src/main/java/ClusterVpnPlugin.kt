package com.aysi.clusterbanned.vpn

import android.app.Activity
import android.content.Intent
import android.net.VpnService
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import org.json.JSONArray

@InvokeArg
class StartArgs {
    var domains: List<String> = emptyList()
    var ips: List<String> = emptyList()
}

@TauriPlugin
class ClusterVpnPlugin(private val activity: Activity) : Plugin(activity) {
    @Command
    fun start(invoke: Invoke) {
        val args = invoke.parseArgs(StartArgs::class.java)
        val prepareIntent = VpnService.prepare(activity)

        if (prepareIntent != null) {
            activity.startActivityForResult(prepareIntent, PERMISSION_REQUEST_CODE)
            invoke.resolve(status("needsPermission", args.domains))
            return
        }

        ClusterVpnService.start(activity, args.domains, args.ips)
        invoke.resolve(status("on", args.domains))
    }

    @Command
    fun stop(invoke: Invoke) {
        ClusterVpnService.stop(activity)
        invoke.resolve(status("off", emptyList()))
    }

    @Command
    fun status(invoke: Invoke) {
        invoke.resolve(status(ClusterVpnService.state(), ClusterVpnService.domains()))
    }

    private fun status(state: String, domains: List<String>): JSObject {
        return JSObject().apply {
            put("state", state)
            put("domains", JSONArray(domains))
        }
    }

    companion object {
        private const val PERMISSION_REQUEST_CODE = 7401
        private const val NOTIFICATION_PERMISSION_REQUEST_CODE = 7403
    }
}