package com.rokid.cxrswithcxrl.state

import com.rokid.cxrswithcxrl.data.PlayStatePacket
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class PlayStateCache {
    private val _state = MutableStateFlow<PlayStatePacket?>(null)
    val state: StateFlow<PlayStatePacket?> = _state.asStateFlow()

    fun updateState(packet: PlayStatePacket) {
        _state.value = packet
    }

    fun clear() {
        _state.value = null
    }
}
