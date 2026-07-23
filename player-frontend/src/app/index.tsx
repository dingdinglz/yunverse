import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackendConfigModal } from '@/components/backend-config-modal';
import { ConnectionStatusBar } from '@/components/connection-status-bar';
import { CurrentSelection } from '@/components/current-selection';
import { NoteButtonGrid } from '@/components/note-button-grid';
import { PlayFeedback } from '@/components/play-feedback';
import { SelectorModal } from '@/components/selector-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useConfig } from '@/hooks/use-config';
import { useConnection } from '@/hooks/use-connection';
import { usePlay } from '@/hooks/use-play';
import { usePreferences } from '@/hooks/use-preferences';
import { useTheme } from '@/hooks/use-theme';
import type { InstrumentCode, KeySignature, NoteCode } from '@/types/domain';

/**
 * 演奏主界面（单页），组合连接状态、当前选择、音符按钮和演奏反馈。
 * 见 mobile-client.md §4 / §6.2 / §8。
 */
export default function PlayScreen() {
  const theme = useTheme();
  const { preferences, loaded, setBackendBaseUrl, setSelectedInstrument, setSelectedKey } =
    usePreferences();

  const baseUrl = preferences.backendBaseUrl;
  const { status, retry } = useConnection(baseUrl);
  const { instruments, keys, notes, refresh } = useConfig(baseUrl);
  const { phase, pendingNote, recent, errorMessage, triggerPlay } = usePlay(baseUrl);

  const [instrumentModal, setInstrumentModal] = useState(false);
  const [keyModal, setKeyModal] = useState(false);
  const [backendModal, setBackendModal] = useState(false);

  const instrumentName = useMemo(
    () =>
      instruments.find((i) => i.code === preferences.selectedInstrument)?.name ??
      preferences.selectedInstrument,
    [instruments, preferences.selectedInstrument],
  );

  const instrumentOptions = useMemo(
    () => instruments.map((i) => ({ value: i.code, label: i.name })),
    [instruments],
  );
  const keyOptions = useMemo(() => keys.map((k) => ({ value: k, label: k })), [keys]);

  const handlePlay = (note: NoteCode) => {
    triggerPlay({
      instrument: preferences.selectedInstrument,
      key: preferences.selectedKey,
      note,
    });
  };

  const handleSaveBackend = (url: string) => {
    setBackendBaseUrl(url);
    // baseUrl 变化会自动触发 useConnection / useConfig 重新请求。
  };

  if (!loaded) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator color={theme.accent} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.content}>
          <ConnectionStatusBar
            status={status}
            baseUrl={baseUrl}
            onPressEdit={() => setBackendModal(true)}
            onRetry={retry}
          />

          <CurrentSelection
            instrumentName={instrumentName}
            keyLabel={preferences.selectedKey}
            onChangeInstrument={() => setInstrumentModal(true)}
            onChangeKey={() => setKeyModal(true)}
          />

          <View style={styles.playArea}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
              点击演奏
            </ThemedText>
            <NoteButtonGrid notes={notes} pendingNote={pendingNote} onPressNote={handlePlay} />
          </View>

          <PlayFeedback phase={phase} recent={recent} errorMessage={errorMessage} />
        </View>
      </SafeAreaView>

      <SelectorModal<InstrumentCode>
        visible={instrumentModal}
        title="选择乐器"
        options={instrumentOptions}
        selected={preferences.selectedInstrument}
        onSelect={setSelectedInstrument}
        onClose={() => setInstrumentModal(false)}
      />

      <SelectorModal<KeySignature>
        visible={keyModal}
        title="选择音调"
        options={keyOptions}
        selected={preferences.selectedKey}
        onSelect={setSelectedKey}
        onClose={() => setKeyModal(false)}
      />

      <BackendConfigModal
        visible={backendModal}
        initialValue={baseUrl}
        onSave={(url) => {
          handleSaveBackend(url);
          void refresh();
        }}
        onClose={() => setBackendModal(false)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
    gap: Spacing.four,
  },
  playArea: {
    gap: Spacing.two,
  },
  sectionLabel: {
    paddingHorizontal: Spacing.half,
  },
});
