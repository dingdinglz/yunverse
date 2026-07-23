import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { NoteButton, NoteCode } from '@/types/domain';

interface NoteButtonGridProps {
  notes: NoteButton[];
  /** 正在发送请求的音符（用于按钮短暂 loading，不全局禁用）。 */
  pendingNote: NoteCode | null;
  onPressNote: (note: NoteCode) => void;
}

const COLUMNS = 4;

/** 将音符按 COLUMNS 分行，末行用 null 占位以保持按钮等宽。 */
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

/**
 * 音符按钮网格（mobile-client.md §6.5 / §8.4 / §10）。
 * - 大按钮、两行布局、足够间距，避免误触。
 * - 点击轻量反馈（按下缩放 + 高亮）。
 * - 被点按钮显示短暂 loading，不全局禁用其他按钮，保证演奏手感。
 */
export function NoteButtonGrid({ notes, pendingNote, onPressNote }: NoteButtonGridProps) {
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
    gap: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  button: {
    flex: 1,
    minHeight: 84,
    borderWidth: 1,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    flex: 1,
  },
  label: {
    fontSize: 28,
    lineHeight: 34,
  },
});
