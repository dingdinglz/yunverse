import type { InstrumentCode, NoteButton, NoteCode } from '@/types/domain';

const NOTE_NAMES = ['do', 'ri', 'mi', 'fa', 'so', 'la', 'xi'] as const;

export const PIPA_NOTES: NoteButton[] = [
  { code: 'do_low' as NoteCode, label: 'do', degree: 1, register: 'low' },
  { code: 'so_low' as NoteCode, label: 'so', degree: 5, register: 'low' },
  { code: 'la_low' as NoteCode, label: 'la', degree: 6, register: 'low' },
  { code: 'do' as NoteCode, label: 'do', degree: 1, register: 'normal' },
  { code: 'ri' as NoteCode, label: 'ri', degree: 2, register: 'normal' },
  { code: 'mi' as NoteCode, label: 'mi', degree: 3, register: 'normal' },
  { code: 'fa' as NoteCode, label: 'fa', degree: 4, register: 'normal' },
  { code: 'so' as NoteCode, label: 'so', degree: 5, register: 'normal' },
  { code: 'xi' as NoteCode, label: 'xi', degree: 7, register: 'normal' },
  { code: 'do_high' as NoteCode, label: 'do', degree: 1, register: 'high' },
  { code: 'ri_high' as NoteCode, label: 'ri', degree: 2, register: 'high' },
  { code: 'mi_high' as NoteCode, label: 'mi', degree: 3, register: 'high' },
  { code: 'fa_high' as NoteCode, label: 'fa', degree: 4, register: 'high' },
  { code: 'so_high' as NoteCode, label: 'so', degree: 5, register: 'high' },
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

export const GUZHENG_NOTES: NoteButton[] = [
  { code: 'so_low' as NoteCode, label: 'so', degree: 5, register: 'low' },
  { code: 'la_low' as NoteCode, label: 'la', degree: 6, register: 'low' },
  { code: 'do' as NoteCode, label: 'do', degree: 1, register: 'normal' },
  { code: 'ri' as NoteCode, label: 'ri', degree: 2, register: 'normal' },
  { code: 'mi' as NoteCode, label: 'mi', degree: 3, register: 'normal' },
  { code: 'so' as NoteCode, label: 'so', degree: 5, register: 'normal' },
  { code: 'la' as NoteCode, label: 'la', degree: 6, register: 'normal' },
];

export const ERHU_NOTES: NoteButton[] = [
  ...NOTE_NAMES.map((name, i) => ({
    code: name as NoteCode,
    label: name,
    degree: i + 1,
    register: 'normal' as const,
  })),
  { code: 'do_high' as NoteCode, label: 'do', degree: 1, register: 'high' },
  { code: 'ri_high' as NoteCode, label: 'ri', degree: 2, register: 'high' },
  { code: 'mi_high' as NoteCode, label: 'mi', degree: 3, register: 'high' },
  { code: 'fa_high' as NoteCode, label: 'fa', degree: 4, register: 'high' },
  { code: 'so_high' as NoteCode, label: 'so', degree: 5, register: 'high' },
];

const DIZI_LOW_NAMES = ['so', 'la', 'xi'] as const;
const DIZI_HIGH_NAMES = ['do', 'ri', 'mi', 'fa', 'so', 'la'] as const;

export const DIZI_NOTES: NoteButton[] = [
  ...DIZI_LOW_NAMES.map((name, i) => ({
    code: `${name}_low` as NoteCode,
    label: name,
    degree: i + 5,
    register: 'low' as const,
  })),
  ...NOTE_NAMES.map((name, i) => ({
    code: name as NoteCode,
    label: name,
    degree: i + 1,
    register: 'normal' as const,
  })),
  ...DIZI_HIGH_NAMES.map((name, i) => ({
    code: `${name}_high` as NoteCode,
    label: name,
    degree: i + 1,
    register: 'high' as const,
  })),
];

export const NOTES_BY_INSTRUMENT: Record<InstrumentCode, NoteButton[]> = {
  pipa: PIPA_NOTES,
  suona: SUONA_NOTES,
  guzheng: GUZHENG_NOTES,
  erhu: ERHU_NOTES,
  dizi: DIZI_NOTES,
};

export const NOTES: NoteButton[] = PIPA_NOTES;
