import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { ConnectionStatus } from '@/hooks/use-connection';
import { useTheme } from '@/hooks/use-theme';

interface ConnectionStatusBarProps {
  status: ConnectionStatus;
  baseUrl: string;
  onPressEdit: () => void;
  onRetry: () => void;
}

const STATUS_TEXT: Record<ConnectionStatus, string> = {
  connecting: '连接中…',
  connected: '已连接',
  disconnected: '未连接',
};

/**
 * 顶部连接状态条：状态点 + 文案 + 后端地址 + 编辑入口（mobile-client.md §4 顶部区域）。
 * 状态点用于表达真实连接状态（语义化，非装饰）。
 */
export function ConnectionStatusBar({
  status,
  baseUrl,
  onPressEdit,
  onRetry,
}: ConnectionStatusBarProps) {
  const theme = useTheme();

  const dotColor =
    status === 'connected'
      ? theme.success
      : status === 'connecting'
        ? theme.warning
        : theme.danger;

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.row}>
        <View style={styles.statusGroup}>
          <View style={[styles.dot, { backgroundColor: dotColor }]} />
          <ThemedText type="smallBold">{STATUS_TEXT[status]}</ThemedText>
        </View>
        <View style={styles.actions}>
          {status === 'disconnected' && (
            <Pressable
              onPress={onRetry}
              hitSlop={8}
              style={({ pressed }) => [styles.action, pressed && styles.pressed]}
              accessibilityRole="button">
              <ThemedText type="small" themeColor="accent">
                重试
              </ThemedText>
            </Pressable>
          )}
          <Pressable
            onPress={onPressEdit}
            hitSlop={8}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}
            accessibilityRole="button">
            <ThemedText type="small" themeColor="accent">
              编辑
            </ThemedText>
          </Pressable>
        </View>
      </View>
      <ThemedText type="code" themeColor="textSecondary" numberOfLines={1}>
        {baseUrl}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  action: {
    paddingVertical: Spacing.half,
  },
  pressed: {
    opacity: 0.6,
  },
});
