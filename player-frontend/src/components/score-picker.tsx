import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  getScores,
  startScore,
  stopScore,
  type ScoreActiveState,
  type ScoreSummary,
} from '@/services/score-service';

interface ScorePickerProps {
  visible: boolean;
  baseUrl: string;
  onClose: () => void;
}

/**
 * 曲谱选择弹窗：展示可用曲目列表，点击即激活曲谱模式。
 * 若当前已在曲谱模式，显示停止按钮。
 */
export function ScorePicker({ visible, baseUrl, onClose }: ScorePickerProps) {
  const theme = useTheme();
  const [scores, setScores] = useState<ScoreSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchScores = useCallback(async () => {
    try {
      const data = await getScores(baseUrl);
      setScores(data.scores);
    } catch {
      // 网络错误忽略
    }
  }, [baseUrl]);

  useEffect(() => {
    if (visible) {
      fetchScores();
    }
  }, [visible, fetchScores]);

  const handleSelect = async (scoreId: string) => {
    setLoading(true);
    try {
      const state: ScoreActiveState = await startScore(baseUrl, scoreId);
      setActiveId(state.scoreId);
      onClose();
    } catch {
      // 错误忽略
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      await stopScore(baseUrl);
      setActiveId(null);
    } catch {
      // 错误忽略
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="关闭">
        <Pressable style={styles.sheetWrapper} onPress={() => {}}>
          <View style={[styles.sheet, { backgroundColor: theme.background }]}>
            <SafeAreaView edges={['bottom']}>
              <View style={styles.handleRow}>
                <View style={[styles.handle, { backgroundColor: theme.border }]} />
              </View>
              <View style={styles.header}>
                <ThemedText type="subtitle" style={styles.title}>
                  选择曲谱
                </ThemedText>
                {activeId && (
                  <Pressable onPress={handleStop} disabled={loading}>
                    <ThemedText type="small" themeColor="accent">
                      停止曲谱
                    </ThemedText>
                  </Pressable>
                )}
              </View>
              <ScrollView
                style={styles.list}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}>
                {scores.map((score) => {
                  const isActive = score.id === activeId;
                  return (
                    <Pressable
                      key={score.id}
                      onPress={() => handleSelect(score.id)}
                      disabled={loading}
                      style={({ pressed }) => [
                        styles.option,
                        {
                          backgroundColor: isActive
                            ? theme.accentSoft
                            : pressed
                              ? theme.backgroundElement
                              : 'transparent',
                        },
                      ]}
                      accessibilityRole="button">
                      <View style={styles.optionContent}>
                        <ThemedText
                          type={isActive ? 'smallBold' : 'default'}
                          themeColor={isActive ? 'accent' : 'text'}>
                          {score.title}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {score.instrument} · {score.key}调 · {score.noteCount}音
                        </ThemedText>
                      </View>
                      {isActive && (
                        <View style={[styles.activeDot, { backgroundColor: theme.accent }]} />
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
    minHeight: 280,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
  },
  title: {
    fontSize: 22,
    lineHeight: 30,
  },
  list: {
    flexGrow: 1,
    flexShrink: 1,
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
  optionContent: {
    flex: 1,
    gap: 2,
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
