package com.rokid.cxrswithcxrl.activities.main

import android.util.Base64
import android.util.Log
import androidx.lifecycle.ViewModel
import com.rokid.cxr.CXRServiceBridge
import com.rokid.cxr.Caps
import com.rokid.cxrswithcxrl.data.PlayStatePacket
import com.rokid.cxrswithcxrl.receiver.KeyEventListener
import com.rokid.cxrswithcxrl.receiver.KeyReceiver
import com.rokid.cxrswithcxrl.receiver.KeyType
import com.rokid.cxrswithcxrl.state.PlayStateCache
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * CXR-S bridge hub for CustomApp custom commands.
 *
 * Doc reference:
 * - CXR-L 自定义指令: [CXRServiceBridge], subscribe / sendMessage, Caps
 * - CXR-L 自定义指令: channel keys must match phone [CustomCmdViewModel]
 *
 * Phone → glasses: subscribe [clientKey] (`rk_custom_client`), receive in [msgCallback.onReceive].
 * Glasses → phone: [sendMessage] with [cmdKey] (`rk_custom_key`) and [Caps].
 */
class MainViewModel: ViewModel() {
    private val _capsFromClient = MutableStateFlow("")
    val capsFromClient = _capsFromClient.asStateFlow()

    private val playStateCache = PlayStateCache()
    val playState: StateFlow<PlayStatePacket?> = playStateCache.state

    private val cxrBridge = CXRServiceBridge()

    /** Glasses → phone reply channel; matches phone [ICustomCmdCbk] filter `rk_custom_key`. */
    private val cmdKey = "rk_custom_key"

    /** Phone → glasses subscribe channel; matches phone [sendCustomCmd] first argument. */
    private val clientKey = "rk_custom_client"

    private val keyEventListener = object : KeyEventListener {
        override fun onKeyEvent(keyType: KeyType) {
//            viewModel.sendMessage("Down keyCode = $keyCode， event = ${event?.action}")
            sendMessage("Listener: key action = ${keyType.name}")
        }

    }

    val keyReceiver = KeyReceiver(keyEventListener)

    private val connectionCallback = object : CXRServiceBridge.StatusListener{
        override fun onConnected(p0: String?, p1: String?, p2: Int) {
            Log.d("CXR", "onConnected")
        }

        override fun onDisconnected() {
            Log.d("CXR", "onDisconnected")
        }

        override fun onConnecting(p0: String?, p1: String?, p2: Int) {
            Log.d("CXR", "onConnecting")
        }

        override fun onARTCStatus(p0: Float, p1: Boolean) {
        }

        override fun onRokidAccountChanged(p0: String?) {
        }

        override fun onAudioNoise(p0: Float) {

        }

    }

    private val msgCallback = object : CXRServiceBridge.MsgCallback {
        override fun onReceive(name: String?, args: Caps?, bytes: ByteArray?) {
            // 保留原有调试显示
            val received = "name = $name, args = ${args?.let { parseCaps(it) } ?: run { "null" }}"
            _capsFromClient.value = received

            // 解析 PlayStatePacket
            try {
                val cmdType = args?.at(0)?.string ?: return
                if (cmdType != "play_state") return
                val jsonString = args.at(1)?.string ?: return
                val packet = PlayStatePacket.fromJson(jsonString)
                playStateCache.updateState(packet)
                Log.i(
                    "PlayState",
                    "PlayState received: ${packet.instrument.code} / ${packet.key} / ${packet.note.label}"
                )
            } catch (e: Exception) {
                Log.e("PlayState", "Parse error: ${e.message}")
            }
        }
    }

    init {
        // CXR-L 自定义指令: setStatusListener then subscribe before handling phone commands.
        cxrBridge.setStatusListener(connectionCallback)
        cxrBridge.subscribe(clientKey, msgCallback)
    }

    /** Sends a Caps payload to the phone on [cmdKey]. Used by keys and [KeyReceiver]. */
    fun sendMessage(str: String){
        cxrBridge.sendMessage(cmdKey, Caps().apply {
            write("message")
            write(str)
        })
    }
    private fun parseCaps(caps: Caps): String {
        val strBuilder = StringBuilder("{")
        for (i in 0 until caps.size()) {
            val capsValue = caps.at(i)
            val string = when (capsValue.type()) {
                Caps.Value.TYPE_STRING -> {
                    "string:${capsValue.string}"
                }

                Caps.Value.TYPE_INT32,
                Caps.Value.TYPE_UINT32 -> {
                    "int:${capsValue.int}"
                }

                Caps.Value.TYPE_INT64,
                Caps.Value.TYPE_UINT64 -> {
                    "long:${capsValue.long}"
                }

                Caps.Value.TYPE_FLOAT -> {
                    "float:${capsValue.float}"
                }

                Caps.Value.TYPE_DOUBLE -> {
                    "double:${capsValue.double}"
                }

                Caps.Value.TYPE_OBJECT -> {//Caps 对象
                    parseCaps(capsValue.`object`)
                }

                Caps.Value.TYPE_BINARY -> {
                    capsValue.binary?.let {
                        "binary:${Base64.encode(it.data, it.length)}"
                    } ?: "binary:null"
                }

                else -> {
                    "unknown:null"
                }
            }
            strBuilder.append("${string},")
        }
        if (strBuilder.length > 4) {//如果有值，删除最后一个逗号
            strBuilder.deleteCharAt(strBuilder.length - 1)
        }
        strBuilder.append("}")
        return strBuilder.toString()
    }

}
