import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { NoteButton, NoteCode, NoteRegister } from '@/types/domain';

interface NoteButtonGridProps {
  notes: NoteButton[];
  pendingNote: NoteCode | null;
  onPressNote: (note: NoteCode) => void;
}

const COLUMNS = 4;
const REGISTERS: NoteRegister[] = ['low', 'normal', 'high'];
const REGISTER_LABELS: Record<NoteRegister, string> = {
  low: '低音',
  normal: '正常',
  high: '高音',
};

function chunkIntoRows(notes: NoteButton[]): (NoteButton | null)[][] {
  const rows: (NoteButton | null)[][] = [];
  for (let i = 0; i < notes.length; i += COLUMNS) {
    const row: (NoteButton | null)[] = notes.slice(i, i + COLUMNS);
    while (row.length < COLUMNS) {
      row.push(null);
    }
    rows.push(row);
  }
  return rows;
}

function hasMultipleRegisters(notes: NoteButton[]): boolean {
  const registers = new Set(notes.map((n) => n.register).filter(Boolean));
  return registers.size > 1;
}

export function NoteButtonGrid({ notes, pendingNote, onPressNote }: NoteButtonGridProps) {
  if (hasMultipleRegisters(notes)) {
    return (
      <RegisterGrid notes={notes} pendingNote={pendingNote} onPressNote={onPressNote} />
    );
  }
  return <ClassicGrid notes={notes} pendingNote={pendingNote} onPressNote={onPressNote} />;
}

function ClassicGrid({ notes, pendingNote, onPressNote }: NoteButtonGridProps) {
  const rows = chunkIntoRows(notes);
  return (
    <View style={styles.grid}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((note, colIndex) =>
            note ? (
              <NoteButtonItem
                key={note.code}
                note={note}
                pending={pendingNote === note.code}
                onPress={() => onPressNote(note.code)}
              />
            ) : (
              <View key={`spacer-${colIndex}`} style={styles.spacer} />
            ),
          )}
        </View>
      ))}
    </View>
  );
}

function RegisterGrid({ notes, pendingNote, onPressNote }: NoteButtonGridProps) {
  const theme = useTheme();
  const allColumns = REGISTERS.map((reg) => notes.filter((n) => n.register === reg));
  const activeRegisters = REGISTERS.filter((_, i) => allColumns[i].length > 0);
  const columns = activeRegisters.map((reg) => notes.filter((n) => n.register === reg));
  const maxRows = Math.max(...columns.map((col) => col.length));

  return (
    <View style={styles.grid}>
      <View style={styles.row}>
        {activeRegisters.map((reg) => (
          <View key={reg} style={styles.headerCell}>
            <ThemedText type="small" themeColor="textSecondary">
              {REGISTER_LABELS[reg]}
            </ThemedText>
          </View>
        ))}
      </View>
      {Array.from({ length: maxRows }, (_, rowIdx) => (
        <View key={rowIdx} style={styles.row}>
          {columns.map((col, colIdx) => {
            const note = col[rowIdx];
            return note ? (
              <NoteButtonItem
                key={note.code}
                note={note}
                pending={pendingNote === note.code}
                onPress={() => onPressNote(note.code)}
              />
            ) : (
              <View key={`empty-${colIdx}-${rowIdx}`} style={styles.spacer} />
            );
          })}
        </View>
      ))}
    </View>
  );
}

interface NoteButtonItemProps {
  note: NoteButton;
  pending: boolean;
  onPress: () => void;
}

function NoteButtonItem({ note, pending, onPress }: NoteButtonItemProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: pending || pressed ? theme.accent : theme.backgroundElement,
          borderColor: pending || pressed ? theme.accent : theme.border,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`演奏 ${note.label}`}>
      {pending ? (
        <ActivityIndicator color={theme.accentText} />
      ) : (
        <ThemedText type="title" style={styles.label}>
          {note.label}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  headerCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.half,
  },
  button: {
    flex: 1,
    minHeight: 56,
    borderWidth: 1,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    flex: 1,
  },
  label: {
    fontSize: 22,
    lineHeight: 28,
  },
});
