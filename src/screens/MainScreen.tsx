import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme/tokens';
import { TabBar } from '../components/TabBar';
import { Toast } from '../components/Toast';
import { OverlayHost } from '../components/OverlayHost';
import { HomeTab } from './HomeTab';
import { PetTab } from './PetTab';
import { QuestsTab } from './QuestsTab';
import { CalendarTab } from './CalendarTab';
import { useStore } from '../store/store';

export function MainScreen() {
  const state = useStore((s) => s.state);
  const tab = useStore((s) => s.state?.tab ?? 'home');
  const setTab = useStore((s) => s.setTab);
  const openOverlay = useStore((s) => s.openOverlay);

  if (!state) return <View style={styles.root} />;

  return (
    <View style={styles.root}>
      {tab === 'home' ? (
        <HomeTab onTab={setTab} />
      ) : tab === 'pet' ? (
        <PetTab />
      ) : tab === 'quests' ? (
        <QuestsTab onTab={setTab} />
      ) : (
        <CalendarTab />
      )}
      <TabBar active={tab} onTab={setTab} onCapture={() => openOverlay('capture')} />
      <OverlayHost />
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
});
