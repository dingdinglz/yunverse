package com.rokid.cxrswithcxrl.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Rokid glasses leg / touchpad system broadcast actions.
 *
 * Doc reference: CXR-L 眼镜端按键与系统广播 — register dynamically in [MainActivity.onCreate];
 * events forwarded to [com.rokid.cxrswithcxrl.activities.main.MainViewModel.sendMessage].
 * [abortBroadcast] prevents duplicate handling by other receivers.
 */
enum class KeyType(val action: String) {
    CLICK("com.android.action.ACTION_SPRITE_BUTTON_CLICK"),
    BUTTON_DOWN("com.android.action.ACTION_SPRITE_BUTTON_DOWN"),
    BUTTON_UP("com.android.action.ACTION_SPRITE_BUTTON_UP"),
    DOUBLE_CLICK("com.android.action.ACTION_SPRITE_BUTTON_DOUBLE_CLICK"),
    LONG_PRESS("com.android.action.ACTION_SPRITE_BUTTON_LONG_PRESS"),
    AI_START("com.android.action.ACTION_AI_START"),
    ACTION_TWO_FINGER_SINGLE_TAP("com.android.action.ACTION_TWO_FINGER_SINGLE_TAP"),
    ACTION_TWO_FINGER_DOUBLE_TAP("com.android.action.ACTION_TWO_FINGER_DOUBLE_TAP"),
    ACTION_TWO_FINGER_SWIPE_FORWARD("com.android.action.ACTION_TWO_FINGER_SWIPE_FORWARD"),
    ACTION_TWO_FINGER_SWIPE_BACK("com.android.action.ACTION_TWO_FINGER_SWIPE_BACK"),
    ACTION_SETTINGS_KEY("com.android.action.ACTION_SETTINGS_KEY")
}

interface KeyEventListener {
    fun onKeyEvent(keyType: KeyType)
}

class KeyReceiver(val keyEventListener: KeyEventListener): BroadcastReceiver() {

    override fun onReceive(context: Context?, intent: Intent?) {
        intent?.action?.let {
            when (it) {
                KeyType.CLICK.action -> {
                    // click key on Glasses's leg
                    keyEventListener.onKeyEvent(KeyType.CLICK)
                    abortBroadcast()
                }
                KeyType.BUTTON_DOWN.action -> {
                    // when pressed key on Glasses's leg
                    keyEventListener.onKeyEvent(KeyType.BUTTON_DOWN)
                    abortBroadcast()
                }
                KeyType.BUTTON_UP.action -> {
                    // when released key on Glasses's leg
                    keyEventListener.onKeyEvent(KeyType.BUTTON_UP)
                    abortBroadcast()
                }
                KeyType.DOUBLE_CLICK.action -> {
                    // when double click key on Glasses's leg
                    keyEventListener.onKeyEvent(KeyType.DOUBLE_CLICK)
                    abortBroadcast()
                }
                KeyType.LONG_PRESS.action -> {
                    // when long press key on Glasses's leg
                    keyEventListener.onKeyEvent(KeyType.LONG_PRESS)
                    abortBroadcast()
                }
                KeyType.AI_START.action -> {
                    // when AI start(long press the touch pad on Glasses's leg)
                    keyEventListener.onKeyEvent(KeyType.AI_START)
                    abortBroadcast()
                }
                KeyType.ACTION_TWO_FINGER_SINGLE_TAP.action -> {
                    // when single tap touchpad on Glasses's leg
                    keyEventListener.onKeyEvent(KeyType.ACTION_TWO_FINGER_SINGLE_TAP)
                    abortBroadcast()
                }
                KeyType.ACTION_TWO_FINGER_DOUBLE_TAP.action -> {
                    // when double tap touchpad on Glasses's leg
                    keyEventListener.onKeyEvent(KeyType.ACTION_TWO_FINGER_DOUBLE_TAP)
                    abortBroadcast()
                }
                KeyType.ACTION_TWO_FINGER_SWIPE_FORWARD.action -> {
                    // when swipe forward touchpad on Glasses's leg
                    keyEventListener.onKeyEvent(KeyType.ACTION_TWO_FINGER_SWIPE_FORWARD)
                    abortBroadcast()
                }
                KeyType.ACTION_TWO_FINGER_SWIPE_BACK.action -> {
                    // when swipe back touchpad on Glasses's leg
                    keyEventListener.onKeyEvent(KeyType.ACTION_TWO_FINGER_SWIPE_BACK)
                    abortBroadcast()
                }
                KeyType.ACTION_SETTINGS_KEY.action -> {
                    // do nothing
                    keyEventListener.onKeyEvent(KeyType.ACTION_SETTINGS_KEY)
                    abortBroadcast()
                }
            }
        }
    }
}