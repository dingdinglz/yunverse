package expo.modules.rokidcxr

import android.util.Log
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import com.rokid.cxr.link.CXRLink
import com.rokid.cxr.link.callbacks.ICXRLinkCbk
import com.rokid.cxr.link.callbacks.IGlassAppCbk
import com.rokid.cxr.link.utils.CxrDefs
import com.rokid.cxr.link.utils.GlassInfo
import com.rokid.cxr.Caps
import com.rokid.sprite.aiapp.externalapp.auth.AuthorizationHelper
import com.rokid.sprite.aiapp.externalapp.auth.AuthResult

private const val TAG = "RokidCxr"
private const val AUTH_REQUEST_CODE = 4027
private const val GLASS_APP_PACKAGE = "com.rokid.cxrswithcxrl"
private const val GLASS_APP_ENTRY =
    "com.rokid.cxrswithcxrl.activities.main.MainActivity"
private const val CUSTOM_CMD_CHANNEL = "rk_custom_client"

class RokidCxrModule : Module() {

    private var cxrLink: CXRLink? = null
    @Volatile private var cxrlConnected = false
    @Volatile private var glassBtConnected = false
    @Volatile private var glassAppReady = false
    @Volatile private var appStartInFlight = false
    private var initializePromise: Promise? = null

    private fun publishAuthorizationResult(resultCode: Int, data: android.content.Intent?) {
        try {
            when (val authResult = AuthorizationHelper.parseAuthorizationResult(resultCode, data)) {
                is AuthResult.AuthSuccess -> {
                    val token = authResult.token
                    if (token.isNullOrEmpty()) {
                        sendEvent("onAuthorizationResult", mapOf("error" to "Token is empty"))
                    } else {
                        Log.d(TAG, "Authorization success, token length=${token.length}")
                        sendEvent("onAuthorizationResult", mapOf("token" to token))
                    }
                }
                is AuthResult.AuthFail -> {
                    Log.e(TAG, "Authorization failed: $authResult")
                    sendEvent("onAuthorizationResult", mapOf("error" to "Authorization failed: $authResult"))
                }
                is AuthResult.AuthCancel -> {
                    Log.w(TAG, "Authorization cancelled by user")
                    sendEvent("onAuthorizationResult", mapOf("error" to "Authorization cancelled"))
                }
                else -> {
                    Log.w(TAG, "Unknown authorization result: $authResult")
                    sendEvent("onAuthorizationResult", mapOf("error" to "Unknown result"))
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "parseAuthorizationResult failed", e)
            sendEvent("onAuthorizationResult", mapOf("error" to (e.message ?: "Unknown error")))
        }
    }

    private val linkCallback = object : ICXRLinkCbk {
        override fun onCXRLConnected(connected: Boolean) {
            cxrlConnected = connected
            if (!connected) glassAppReady = false
            Log.i(TAG, "onCXRLConnected: connected=$connected")
            startGlassAppWhenReady()
        }

        override fun onGlassBtConnected(connected: Boolean) {
            glassBtConnected = connected
            if (!connected) glassAppReady = false
            Log.i(TAG, "onGlassBtConnected: connected=$connected")
            startGlassAppWhenReady()
        }

        override fun onGlassAiAssistStart() = Unit
        override fun onGlassAiAssistStop() = Unit
        override fun onGlassAiInterrupt(interruptWake: Boolean) = Unit
        override fun onGlassDeviceInfo(deviceInfo: GlassInfo) = Unit
        override fun onGlassWearingStatus(wearing: Boolean) = Unit
    }

    private val appCallback = object : IGlassAppCbk {
        override fun onInstallAppResult(result: Boolean) {
            Log.d(TAG, "onInstallAppResult=$result")
        }

        override fun onUnInstallAppResult(result: Boolean) {
            Log.d(TAG, "onUnInstallAppResult=$result")
        }

        override fun onOpenAppResult(result: Boolean) {
            appStartInFlight = false
            glassAppReady = result
            Log.i(TAG, "onOpenAppResult=$result")
            initializePromise?.resolve(result)
            initializePromise = null
        }

        override fun onStopAppResult(result: Boolean) {
            Log.d(TAG, "onStopAppResult=$result")
        }

        override fun onGlassAppResume(result: Boolean) {
            Log.d(TAG, "onGlassAppResume=$result")
        }

        override fun onQueryAppResult(result: Boolean) {
            Log.d(TAG, "onQueryAppResult=$result")
        }
    }

    @Synchronized
    private fun startGlassAppWhenReady() {
        val link = cxrLink ?: return
        if (!cxrlConnected || !glassBtConnected || glassAppReady || appStartInFlight) return

        appStartInFlight = true
        Log.i(TAG, "Both links ready; appStart entry=$GLASS_APP_ENTRY")
        try {
            link.appStart(GLASS_APP_ENTRY, appCallback)
        } catch (e: Exception) {
            appStartInFlight = false
            Log.e(TAG, "appStart failed", e)
            initializePromise?.reject("ERR_APP_START", e.message ?: "Failed to start glasses app", e)
            initializePromise = null
        }
    }

    private fun resetConnectionState() {
        cxrlConnected = false
        glassBtConnected = false
        glassAppReady = false
        appStartInFlight = false
    }

    override fun definition() = ModuleDefinition {
        Name("RokidCxr")

        Events("onAuthorizationResult")

        OnActivityResult { _, payload ->
            val (requestCode, resultCode, data) = payload
            if (requestCode != AUTH_REQUEST_CODE) return@OnActivityResult
            publishAuthorizationResult(resultCode, data)
        }

        AsyncFunction("requestAuthorization") { promise: Promise ->
            val activity = appContext.currentActivity
            if (activity == null) {
                promise.reject("ERR_NO_ACTIVITY", "No current activity", null)
                return@AsyncFunction
            }
            try {
                if (!AuthorizationHelper.isRokidAppInstalled(activity)) {
                    promise.reject("ERR_NO_ROKID_APP", "Rokid AI App is not installed", null)
                    return@AsyncFunction
                }

                AuthorizationHelper.requestAuthorization(activity, null, AUTH_REQUEST_CODE)?.let {
                    publishAuthorizationResult(it.first, it.second)
                }
                promise.resolve(null)
            } catch (e: Exception) {
                Log.e(TAG, "requestAuthorization failed", e)
                promise.reject("ERR_AUTH_REQUEST", e.message ?: "Failed to request authorization", e)
            }
        }

        AsyncFunction("initialize") { token: String, promise: Promise ->
            try {
                val context = appContext.reactContext
                if (context == null) {
                    promise.reject("ERR_NO_CONTEXT", "React context is null", null)
                    return@AsyncFunction
                }

                cxrLink?.disconnect()
                resetConnectionState()
                initializePromise = promise

                val link = CXRLink(context).apply {
                    configCXRSession(
                        CxrDefs.CXRSession(
                            CxrDefs.CXRSessionType.CUSTOMAPP,
                            GLASS_APP_PACKAGE
                        )
                    )
                    setCXRLinkCbk(linkCallback)
                }
                cxrLink = link

                val connected = link.connect(token)
                if (!connected) {
                    initializePromise = null
                    promise.reject("ERR_CONNECT", "CXRLink.connect() returned false", null)
                    return@AsyncFunction
                }
            } catch (e: Exception) {
                initializePromise = null
                Log.e(TAG, "initialize failed", e)
                promise.reject("ERR_INIT", e.message ?: "Initialization failed", e)
            }
        }

        AsyncFunction("sendPlayState") { json: String, promise: Promise ->
            try {
                val link = cxrLink
                if (link == null || !cxrlConnected || !glassBtConnected || !glassAppReady) {
                    Log.w(TAG, "sendPlayState skipped: CustomApp session is not ready")
                    promise.resolve(false)
                    return@AsyncFunction
                }

                val caps = Caps()
                caps.write("play_state")
                caps.write(json)
                link.sendCustomCmd(CUSTOM_CMD_CHANNEL, caps)

                promise.resolve(true)
            } catch (e: Exception) {
                Log.e(TAG, "sendPlayState failed", e)
                promise.resolve(false)
            }
        }

        AsyncFunction("disconnect") { promise: Promise ->
            try {
                cxrLink?.disconnect()
                cxrLink = null
                initializePromise = null
                resetConnectionState()
                promise.resolve(null)
            } catch (e: Exception) {
                Log.e(TAG, "disconnect failed", e)
                promise.reject("ERR_DISCONNECT", e.message ?: "Disconnect failed", e)
            }
        }
    }
}
