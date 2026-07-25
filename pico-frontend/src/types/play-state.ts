// 对齐 backend/app/api.py GET /api/v1/state 与 GET /api/v1/events 的 payload 结构。
export interface CodeName {
  code: string;
  name: string;
}

export interface NoteRef {
  code: string;
  label: string;
}

export interface PlayState {
  instrument: CodeName | null;
  key: string | null;
  note: NoteRef | null;
  technique: CodeName | null;
  playback: {
    status: string;
  };
}

// 曲谱模式状态（对齐 backend/app/score_store.py 的 snapshot 结构）
export interface ScoreNote {
  code: string;
  duration: number;
  lyric?: string;
  index: number;
  active: boolean;
}

export interface ScoreState {
  active: boolean;
  scoreId: string | null;
  title?: string;
  instrument?: string;
  key?: string;
  tempo?: number;
  currentIndex: number;
  totalNotes: number;
  notes: ScoreNote[];
}
