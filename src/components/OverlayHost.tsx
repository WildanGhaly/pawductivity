import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Dimensions, BackHandler } from 'react-native';
import { useStore, OverlayName } from '../store/store';

import { FocusScreen } from '../screens/FocusScreen';
import { RewardOverlay } from '../screens/RewardOverlay';
import { ShopScreen } from '../screens/ShopScreen';
import { PremiumScreen } from '../screens/PremiumScreen';
import { ReferralScreen } from '../screens/ReferralScreen';
import { InsightsScreen } from '../screens/InsightsScreen';
import { JourneyScreen } from '../screens/JourneyScreen';
import { AchievementsScreen } from '../screens/AchievementsScreen';
import { RecapScreen } from '../screens/RecapScreen';
import { SyncScreen } from '../screens/SyncScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AppearanceScreen } from '../screens/AppearanceScreen';
import { CaptureSheet } from '../screens/CaptureSheet';
import { GoalSheet } from '../screens/GoalSheet';
import { PlanSheet } from '../screens/PlanSheet';

// Full-screen slide-up overlays (render inside an animated container over Main).
const FULL: Partial<Record<OverlayName, React.ComponentType<{ param?: any }>>> = {
  focus: FocusScreen,
  reward: RewardOverlay,
  shop: ShopScreen,
  premium: PremiumScreen,
  referral: ReferralScreen,
  insights: InsightsScreen,
  journey: JourneyScreen,
  achievements: AchievementsScreen,
  recap: RecapScreen,
  sync: SyncScreen,
  profile: ProfileScreen,
  appearance: AppearanceScreen,
};

// Bottom-sheet overlays (each renders its own Modal, so mount directly).
const SHEET: Partial<Record<OverlayName, React.ComponentType<{ param?: any }>>> = {
  capture: CaptureSheet,
  goal: GoalSheet,
  plan: PlanSheet,
};

const H = Dimensions.get('window').height;

export function OverlayHost() {
  const overlays = useStore((s) => s.overlays);
  const closeOverlay = useStore((s) => s.closeOverlay);
  const translateY = useRef(new Animated.Value(H)).current;

  // The visible overlay is the top of the stack; closing pops back to its parent.
  const overlay = overlays.length ? overlays[overlays.length - 1] : null;
  const depth = overlays.length;
  const isFull = overlay ? !!FULL[overlay.name] : false;

  useEffect(() => {
    if (isFull) {
      translateY.setValue(H);
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 9, tension: 65 }).start();
    }
  }, [overlay?.name, depth, isFull]);

  // Android hardware back closes the active overlay.
  useEffect(() => {
    if (!overlay) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeOverlay();
      return true;
    });
    return () => sub.remove();
  }, [overlay, closeOverlay]);

  if (!overlay) return null;

  const SheetComp = SHEET[overlay.name];
  if (SheetComp) {
    return <SheetComp key={`${overlay.name}-${depth}`} param={overlay.param} />;
  }

  const FullComp = FULL[overlay.name];
  if (!FullComp) return null;

  return (
    <Animated.View style={[styles.full, { transform: [{ translateY }] }]}>
      <FullComp key={`${overlay.name}-${depth}`} param={overlay.param} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  full: { position: 'absolute', inset: 0, zIndex: 50 } as any,
});
