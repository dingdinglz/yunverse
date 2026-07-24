import type { InstrumentCode, NoteButton, NoteCode } from '@/types/domain';

const NOTE_NAMES = ['do', 'ri', 'mi', 'fa', 'so', 'la', 'xi'] as const;

export const GUITAR_NOTES: NoteButton[] = NOTE_NAMES.map((name, i) => ({
  code: name as NoteCode,
  label: name,
  degree: i + 1,
  register: 'normal' as const,
}));

export const PIPA_NOTES: NoteButton[] = [
  ...NOTE_NAMES.map((name, i) => ({
    code: `${name}_low` as NoteCode,
    label: name,
    degree: i + 1,
    register: 'low' as const,
  })),
  ...NOTE_NAMES.map((name, i) => ({
    code: name as NoteCode,
    label: name,
    degree: i + 1,
    register: 'normal' as const,
  })),
  { code: 'do_high' as NoteCode, label: 'do', degree: 1, register: 'high' as const },
];

const SUONA_LOW_NAMES = ['so', 'la', 'xi'] as const;
const SUONA_NORMAL_NAMES = ['do', 'ri', 'mi', 'fa', 'so', 'la'] as const;

export const SUONA_NOTES: NoteButton[] = [
  ...SUONA_LOW_NAMES.map((name, i) => ({
    code: `${name}_low` as NoteCode,
    label: name,
    degree: i + 5,
    register: 'low' as const,
  })),
  ...SUONA_NORMAL_NAMES.map((name, i) => ({
    code: name as NoteCode,
    label: name,
    degree: i + 1,
    register: 'normal' as const,
  })),
];

export const NOTES_BY_INSTRUMENT: Record<InstrumentCode, NoteButton[]> = {
  guitar: GUITAR_NOTES,
  pipa: PIPA_NOTES,
  suona: SUONA_NOTES,
};

export const NOTES: NoteButton[] = GUITAR_NOTES;
