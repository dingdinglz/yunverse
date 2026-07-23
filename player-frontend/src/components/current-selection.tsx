import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface CurrentSelectionProps {
  instrumentName: string;
  keyLabel: string;
  onChangeInstrument: () => void;
  onChangeKey: () => void;
}

interface SelectionCardProps {
  caption: string;
  value: string;
  onPress: () => void;
}

/**
 * 当前乐器 / 音调展示 + 切换入口（mobile-client.md §4 / §6.3 / §6.4）。
 * 点击整卡即可打开对应选择器，点击目标区域大、易操作。
 */
export function CurrentSelection({
  instrumentName,
  keyLabel,
  onChangeInstrument,
  onChangeKey,
}: CurrentSelectionProps) {
  return (
    <View style={styles.row}>
      <SelectionCard caption="当前乐器" value={instrumentName} onPress={onChangeInstrument} />
      <SelectionCard caption="当前音调" value={keyLabel} onPress={onChangeKey} />
    </View>
  );
}

function SelectionCard({ caption, value, onPress }: SelectionCardProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${caption}：${value}，点击切换`}>
      <ThemedText type="small" themeColor="textSecondary">
        {caption}
      </ThemedText>
      <View style={styles.valueRow}>
        <ThemedText type="subtitle" style={styles.value} numberOfLines={1}>
          {value}
        </ThemedText>
        <ThemedText type="small" themeColor="accent">
          切换
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.one,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  value: {
    flexShrink: 1,
    fontSize: 26,
    lineHeight: 34,
  },
  pressed: {
    opacity: 0.75,
  },
});
