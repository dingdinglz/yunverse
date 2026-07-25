import type { ConnectionStatus } from "../hooks/usePlayState";
import type { PlayState } from "../types/play-state";
import "./PlayStateHud.css";

function toHudLabel(value: string): string {
  return value
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

interface PlayStateHudProps {
  state: PlayState | null;
  connection: ConnectionStatus;
}

// 复刻 cxrswithcxrl 的 PlayStateDisplay.kt 版式(黑底绿字、顶部 INSTRUMENT/KEY、
// 居中 CURRENT NOTE、底部 STATUS)，用 WebSpatial 的 enable-xr + translucent
// background-material 把它变成一个悬浮的空间面板。
export function PlayStateHud({ state, connection }: PlayStateHudProps) {
  const statusLabel =
    connection === "connected"
      ? state?.playback.status
        ? toHudLabel(state.playback.status)
        : null
      : toHudLabel(connection);

  return (
    <div className="hud-panel" enable-xr>
      <div className="hud-surface">
        {!state?.instrument ? (
          <div className="hud-empty">WAITING FOR PERFORMANCE</div>
        ) : (
          <>
            <div className="hud-row">
              <div className="hud-field">
                <span className="hud-label">INSTRUMENT</span>
                <span className="hud-value">{state.instrument.name}</span>
              </div>
              <div className="hud-field hud-field-end">
                <span className="hud-label">KEY</span>
                <span className="hud-value">{state.key ?? "--"}</span>
              </div>
            </div>

            <div className="hud-note">
              <span className="hud-label">CURRENT NOTE</span>
              <span className="hud-note-value">{state.note?.label ?? "--"}</span>
            </div>

            <div className="hud-row hud-row-bottom">
              <span className="hud-dot" />
              <div className="hud-field">
                <span className="hud-label">STATUS</span>
                <span className="hud-value">{statusLabel}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
