import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme/tokens';
import { Txt } from '../components/ui';
import { TabBar, TabKey } from '../components/TabBar';
import { Toast } from '../components/Toast';
import { HomeTab } from './HomeTab';
import { useStore } from '../store/store';

// Home is real. Quests/Pet/Calendar are placeholders until their PRs land.
const PLACEHOLDER: Record<TabKey, string> = {
  home: 'Home',
  quests: 'Quests',
  pet: 'Pet',
  cal: 'Calendar',
};

export function MainScreen() {
  const state = useStore((s) => s.state);
  const tab = useStore((s) => s.state?.tab ?? 'home');
  const setTab = useStore((s) => s.setTab);
  const showToast = useStore((s) => s.showToast);

  if (!state) return <View style={styles.root} />;

  return (
    <View style={styles.root}>
      {tab === 'home' ? (
        <HomeTab onTab={setTab} />
      ) : (
        <View style={styles.body}>
          <Txt weight={800} size={22} color={colors.tealInk}>{PLACEHOLDER[tab]}</Txt>
          <Txt color={colors.muted} style={{ marginTop: 6 }}>Coming together, one PR at a time.</Txt>
        </View>
      )}
      <TabBar active={tab} onTab={setTab} onCapture={() => showToast('Quick add coming soon')} />
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
