import type { ScoreState } from "../types/play-state";
import "./ScoreHud.css";

// 简谱数字映射
const CODE_TO_JIANPU: Record<string, string> = {
  do: "1",
  ri: "2",
  mi: "3",
  fa: "4",
  so: "5",
  la: "6",
  xi: "7",
  do_low: "1̣",
  ri_low: "2̣",
  mi_low: "3̣",
  fa_low: "4̣",
  so_low: "5̣",
  la_low: "6̣",
  xi_low: "7̣",
  do_high: "1̇",
  ri_high: "2̇",
  mi_high: "3̇",
  fa_high: "4̇",
  so_high: "5̇",
  la_high: "6̇",
  xi_high: "7̇",
};

function toJianpu(code: string): string {
  return CODE_TO_JIANPU[code] ?? code;
}

interface ScoreHudProps {
  score: ScoreState;
}

export function ScoreHud({ score }: ScoreHudProps) {
  const progress = score.totalNotes > 0
    ? Math.round(((score.currentIndex) / score.totalNotes) * 100)
    : 0;

  return (
    <div className="hud-panel" enable-xr>
      <div className="hud-surface score-surface">
        {/* 顶部信息 */}
        <div className="score-header">
          <span className="score-title">{score.title ?? "曲谱模式"}</span>
          <span className="score-progress">{score.currentIndex + 1} / {score.totalNotes}</span>
        </div>

        {/* 音符流 */}
        <div className="score-flow">
          {score.notes.map((note) => (
            <div
              key={note.index}
              className={`score-note ${note.active ? "score-note-active" : ""} ${
                note.index < score.currentIndex ? "score-note-past" : ""
              }`}
            >
              <span className="score-note-num">{toJianpu(note.code)}</span>
              {note.lyric && <span className="score-note-lyric">{note.lyric}</span>}
            </div>
          ))}
        </div>

        {/* 底部进度条 */}
        <div className="score-bar-wrap">
          <div className="score-bar" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}
