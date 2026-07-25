package com.rokid.cxrswithcxrl.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rokid.cxrswithcxrl.data.PlayStatePacket

private val HudGreen = Color(0xFF38E86A)
private val HudGreenMuted = Color(0xB338E86A)

@Composable
fun PlayStateDisplay(
    packet: PlayStatePacket?,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 28.dp, vertical = 36.dp)
    ) {
        if (packet == null) {
            Text(
                text = "WAITING FOR PERFORMANCE",
                modifier = Modifier.align(Alignment.Center),
                color = HudGreenMuted,
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium,
                letterSpacing = 1.2.sp
            )
        } else {
            Row(
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                HudValue(
                    label = "INSTRUMENT",
                    value = packet.instrument.name,
                    modifier = Modifier.weight(1f)
                )
                HudValue(
                    label = "KEY",
                    value = packet.key,
                    modifier = Modifier.weight(0.55f),
                    textAlign = TextAlign.End
                )
            }

            Column(
                modifier = Modifier.align(Alignment.Center),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "CURRENT NOTE",
                    color = HudGreenMuted,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Medium,
                    letterSpacing = 1.sp
                )
                Text(
                    text = packet.note.label,
                    color = HudGreen,
                    fontSize = 48.sp,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }

            Row(
                modifier = Modifier.align(Alignment.BottomStart),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(7.dp)
                        .background(HudGreen, CircleShape)
                )
                Column {
                    Text(
                        text = "STATUS",
                        color = HudGreenMuted,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Medium,
                        letterSpacing = 1.sp
                    )
                    Text(
                        text = packet.playback.status.toHudLabel(),
                        color = HudGreen,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        }
    }
}

@Composable
private fun HudValue(
    label: String,
    value: String,
    modifier: Modifier = Modifier,
    textAlign: TextAlign = TextAlign.Start
) {
    Column(modifier = modifier) {
        Text(
            text = label,
            modifier = Modifier.fillMaxWidth(),
            color = HudGreenMuted,
            fontSize = 10.sp,
            fontWeight = FontWeight.Medium,
            letterSpacing = 1.sp,
            textAlign = textAlign
        )
        Text(
            text = value,
            modifier = Modifier.fillMaxWidth(),
            color = HudGreen,
            fontSize = 17.sp,
            fontWeight = FontWeight.SemiBold,
            textAlign = textAlign,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}

private fun String.toHudLabel(): String {
    return split('_', '-', ' ')
        .filter(String::isNotBlank)
        .joinToString(" ") { word ->
            word.lowercase().replaceFirstChar { it.titlecase() }
        }
}
