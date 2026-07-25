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
