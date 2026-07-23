import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface BackendConfigModalProps {
  visible: boolean;
  initialValue: string;
  onSave: (value: string) => void;
  onClose: () => void;
}

/**
 * 后端地址配置 Modal（mobile-client.md §6.1 / §8.1）。
 * 底部弹出，编辑后端根地址（不含 /api/v1），保存后由上层持久化并重连。
 */
export function BackendConfigModal({
  visible,
  initialValue,
  onSave,
  onClose,
}: BackendConfigModalProps) {
  const theme = useTheme();
  const [value, setValue] = useState(initialValue);

  // 每次打开时同步最新初始值。
  useEffect(() => {
    if (visible) {
      setValue(initialValue);
    }
  }, [visible, initialValue]);

  const trimmed = value.trim();
  const canSave = trimmed.length > 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheetWrapper} onPress={() => {}}>
          <View style={[styles.sheet, { backgroundColor: theme.background }]}>
            <SafeAreaView edges={['bottom']}>
              <View style={styles.handleRow}>
                <View style={[styles.handle, { backgroundColor: theme.border }]} />
              </View>
              <View style={styles.body}>
                <ThemedText type="subtitle" style={styles.title}>
                  后端地址
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  填写后端根地址，无需包含 /api/v1。真机上请使用局域网 IP。
                </ThemedText>

                <TextInput
                  value={value}
                  onChangeText={setValue}
                  placeholder="http://192.168.1.10:8080"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  inputMode="url"
                  style={[
                    styles.input,
                    {
                      color: theme.text,
                      borderColor: theme.border,
                      backgroundColor: theme.backgroundElement,
                    },
                  ]}
                />

                <View style={styles.buttonRow}>
                  <Pressable
                    onPress={onClose}
                    style={({ pressed }) => [
                      styles.button,
                      styles.buttonGhost,
                      { borderColor: theme.border },
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button">
                    <ThemedText type="smallBold">取消</ThemedText>
                  </Pressable>
                  <Pressable
                    disabled={!canSave}
                    onPress={() => {
                      onSave(trimmed);
                      onClose();
                    }}
                    style={({ pressed }) => [
                      styles.button,
                      { backgroundColor: theme.accent },
                      !canSave && styles.disabled,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button">
                    <ThemedText type="smallBold" themeColor="accentText">
                      保存
                    </ThemedText>
                  </Pressable>
                </View>
              </View>
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
  body: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    fontSize: 22,
    lineHeight: 30,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
    fontFamily: Fonts.mono,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
  },
  buttonGhost: {
    borderWidth: 1,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.7,
  },
});
