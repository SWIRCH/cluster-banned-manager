package com.aysi.clusterbanned.vpn

import android.app.Activity
import android.app.Application
import android.content.Intent
import android.net.VpnService
import android.os.Bundle
import android.view.ViewTreeObserver
import android.webkit.WebView
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
    private var lifecycleCallbacks: Application.ActivityLifecycleCallbacks? = null
    private var focusListener: ViewTreeObserver.OnWindowFocusChangeListener? = null

    override fun load(webView: WebView) {
        super.load(webView)

        // 1. Событие от самого сервиса (остановили из шторки, отозвали VPN и т.д.)
        ClusterVpnService.onStateChanged = {
            activity.runOnUiThread {
                trigger("vpnStateChanged", JSObject())
            }
        }

        // 2. Приложение вернулось на передний план
        val callbacks = object : Application.ActivityLifecycleCallbacks {
            override fun onActivityResumed(a: Activity) {
                if (a === activity) trigger("appResumed", JSObject())
            }
            override fun onActivityCreated(a: Activity, b: Bundle?) {}
            override fun onActivityStarted(a: Activity) {}
            override fun onActivityPaused(a: Activity) {}
            override fun onActivityStopped(a: Activity) {}
            override fun onActivitySaveInstanceState(a: Activity, b: Bundle) {}
            override fun onActivityDestroyed(a: Activity) {}
        }
        lifecycleCallbacks = callbacks
        activity.application.registerActivityLifecycleCallbacks(callbacks)

        // 3. Окно снова получило фокус
        val fl = ViewTreeObserver.OnWindowFocusChangeListener { hasFocus ->
            if (hasFocus) trigger("appResumed", JSObject())
        }
        focusListener = fl
        webView.viewTreeObserver.addOnWindowFocusChangeListener(fl)
    }

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