import { useCallback, useEffect, useState } from 'react';

import { INSTRUMENTS } from '@/constants/instruments';
import { KEYS } from '@/constants/keys';
import { NOTES_BY_INSTRUMENT } from '@/constants/notes';
import { getConfig } from '@/services/play-service';
import type { Instrument, InstrumentCode, KeySignature, NoteButton } from '@/types/domain';

interface ConfigState {
  instruments: Instrument[];
  keys: KeySignature[];
  notes: NoteButton[];
  fromBackend: boolean;
  loading: boolean;
}

export function useConfig(baseUrl: string, selectedInstrument: InstrumentCode) {
  const localNotes = NOTES_BY_INSTRUMENT[selectedInstrument] ?? NOTES_BY_INSTRUMENT.guitar;

  const [state, setState] = useState<ConfigState>({
    instruments: INSTRUMENTS,
    keys: KEYS,
    notes: localNotes,
    fromBackend: false,
    loading: false,
  });

  const [backendNotesByInstrument, setBackendNotesByInstrument] = useState<
    Record<string, NoteButton[]> | null
  >(null);

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const config = await getConfig(baseUrl);
      const enabledInstruments = config.instruments.filter((i) => i.enabled !== false);
      const notesByInst = config.notesByInstrument;
      setBackendNotesByInstrument(notesByInst ?? null);
      const notes = notesByInst?.[selectedInstrument] ?? localNotes;
      setState({
        instruments: enabledInstruments.length > 0 ? enabledInstruments : INSTRUMENTS,
        keys: config.keys && config.keys.length > 0 ? config.keys : KEYS,
        notes,
        fromBackend: true,
        loading: false,
      });
    } catch {
      setBackendNotesByInstrument(null);
      setState({
        instruments: INSTRUMENTS,
        keys: KEYS,
        notes: localNotes,
        fromBackend: false,
        loading: false,
      });
    }
  }, [baseUrl, selectedInstrument, localNotes]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const notes = backendNotesByInstrument?.[selectedInstrument] ?? localNotes;
    setState((prev) => ({ ...prev, notes }));
  }, [selectedInstrument, backendNotesByInstrument, localNotes]);

  return { ...state, refresh };
}
