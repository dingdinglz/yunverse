import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface SelectorOption<T extends string> {
  value: T;
  label: string;
}

interface SelectorModalProps<T extends string> {
  visible: boolean;
  title: string;
  options: SelectorOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
  onClose: () => void;
}

/**
 * 复用的底部弹出选择列表，用于乐器 / 音调切换（mobile-client.md §8.2 / §8.3）。
 * 从底部滑入，点击选项后回调并关闭；点击遮罩关闭。
 */
export function SelectorModal<T extends string>({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: SelectorModalProps<T>) {
  const theme = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="关闭">
        {/* 阻止点击穿透到遮罩 */}
        <Pressable style={styles.sheetWrapper} onPress={() => {}}>
          <View style={[styles.sheet, { backgroundColor: theme.background }]}>
            <SafeAreaView edges={['bottom']}>
              <View style={styles.handleRow}>
                <View style={[styles.handle, { backgroundColor: theme.border }]} />
              </View>
              <View style={styles.header}>
                <ThemedText type="subtitle" style={styles.title}>
                  {title}
                </ThemedText>
              </View>
              <ScrollView
                style={styles.list}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}>
                {options.map((option) => {
                  const isSelected = option.value === selected;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => {
                        onSelect(option.value);
                        onClose();
                      }}
                      style={({ pressed }) => [
                        styles.option,
                        {
                          backgroundColor: isSelected
                            ? theme.accentSoft
                            : pressed
                              ? theme.backgroundElement
                              : 'transparent',
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}>
                      <ThemedText
                        type={isSelected ? 'smallBold' : 'default'}
                        themeColor={isSelected ? 'accent' : 'text'}>
                        {option.label}
                      </ThemedText>
                      {isSelected && (
                        <View style={[styles.selectedDot, { backgroundColor: theme.accent }]} />
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </SafeAreaView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheetWrapper: {
    width: '100%',
  },
  sheet: {
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    maxHeight: '75%',
    overflow: 'hidden',
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: Spacing.two,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
  },
  title: {
    fontSize: 22,
    lineHeight: 30,
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  selectedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
