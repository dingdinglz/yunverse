package com.rokid.cxrswithcxrl.data

import org.json.JSONObject

data class PlayStatePacket(
    val instrument: InstrumentInfo,
    val key: String,
    val note: NoteInfo,
    val technique: TechniqueInfo,
    val playback: PlaybackInfo,
    val phase: String
) {
    data class InstrumentInfo(val code: String, val name: String)
    data class NoteInfo(val code: String, val label: String)
    data class TechniqueInfo(val code: String, val name: String)
    data class PlaybackInfo(val status: String)

    companion object {
        fun fromJson(jsonString: String): PlayStatePacket {
            val json = JSONObject(jsonString)
            val instrument = json.getJSONObject("instrument")
            val note = json.getJSONObject("note")
            val technique = json.getJSONObject("technique")
            val playback = json.getJSONObject("playback")

            return PlayStatePacket(
                instrument = InstrumentInfo(
                    code = instrument.getString("code"),
                    name = instrument.getString("name")
                ),
                key = json.getString("key"),
                note = NoteInfo(
                    code = note.getString("code"),
                    label = note.getString("label")
                ),
                technique = TechniqueInfo(
                    code = technique.getString("code"),
                    name = technique.getString("name")
                ),
                playback = PlaybackInfo(
                    status = playback.getString("status")
                ),
                phase = json.getString("phase")
            )
        }
    }
}
