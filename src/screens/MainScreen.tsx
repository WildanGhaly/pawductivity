import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
  const navigation = useNavigation<any>();
  const state = useStore((s) => s.state);
  const tab = useStore((s) => s.state?.tab ?? 'home');
  const setTab = useStore((s) => s.setTab);
  const openOverlay = useStore((s) => s.openOverlay);

  // When the state is wiped mid-session (Reset all data), return to onboarding
  // instead of stranding the user on a blank Main screen.
  useEffect(() => {
    if (!state) {
      navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
    }
  }, [state, navigation]);

  return <MainInner tab={tab} setTab={setTab} openOverlay={openOverlay} hasState={!!state} />;
}

// Each tab fades + slides in when it becomes active (proto .fade-in on tab switch).
function MainInner({ tab, setTab, openOverlay, hasState }: { tab: any; setTab: (t: any) => void; openOverlay: (n: any) => void; hasState: boolean }) {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 280, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  if (!hasState) return <View style={styles.root} />;

  return (
    <View style={styles.root}>
      <Animated.View style={{ flex: 1, opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }}>
        {tab === 'home' ? (
          <HomeTab onTab={setTab} />
        ) : tab === 'pet' ? (
          <PetTab />
        ) : tab === 'quests' ? (
          <QuestsTab onTab={setTab} />
        ) : (
          <CalendarTab />
        )}
      </Animated.View>
      <TabBar active={tab} onTab={setTab} onCapture={() => openOverlay('capture')} />
      <OverlayHost />
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
});
