import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Dimensions, BackHandler } from 'react-native';
import { useStore, OverlayName, OverlayState } from '../store/store';

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
import { BuySheet } from '../screens/BuySheet';

// Full-screen overlays: slide up from the bottom on open (proto .slide-up, 320ms
// ease-out), slide back down on close (proto .slide-down). Focus is the exception:
// the proto opens it with a subtle fade (.fade-in) and still closes with slide-down.
const FULL: Partial<Record<OverlayName, React.ComponentType<{ param?: any }>>> = {
  focus: FocusScreen,
  shop: ShopScreen,
  premium: PremiumScreen,
  referral: ReferralScreen,
  insights: InsightsScreen,
  journey: JourneyScreen,
  achievements: AchievementsScreen,
  recap: RecapScreen,
  sync: SyncScreen,
  profile: ProfileScreen,
};

// Bottom-sheet overlays (each renders its own animated BottomSheet, driven by `visible`
// so the exit slide-down plays before it unmounts).
const SHEET: Partial<Record<OverlayName, React.ComponentType<{ param?: any; visible?: boolean }>>> = {
  capture: CaptureSheet,
  goal: GoalSheet,
  plan: PlanSheet,
  appearance: AppearanceScreen,
  buy: BuySheet,
};

const H = Dimensions.get('window').height;
const SLIDE_IN = Easing.bezier(0.2, 0.8, 0.2, 1);
const SLIDE_OUT = Easing.bezier(0.4, 0, 0.9, 0.5);

export function OverlayHost() {
  const overlays = useStore((s) => s.overlays);
  const closeOverlay = useStore((s) => s.closeOverlay);
  const translateY = useRef(new Animated.Value(H)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const prevDepth = useRef(0);

  const [full, setFull] = useState<OverlayState | null>(null);
  const [sheet, setSheet] = useState<OverlayState | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const top = overlays.length ? overlays[overlays.length - 1] : null;
  const topFull = top && FULL[top.name] ? top : null;
  const topSheet = top && SHEET[top.name] ? top : null;
  const rewardOpen = top?.name === 'reward';

  // Full overlays: entrance on push, slide-down on close/pop.
  useEffect(() => {
    const depth = overlays.length;
    const pushed = depth > prevDepth.current;
    prevDepth.current = depth;

    if (topFull && topFull !== full) {
      if (pushed) {
        setFull(topFull);
        if (topFull.name === 'focus') {
          // proto .fade-in: opacity 0->1 with a small 8px lift
          translateY.setValue(8);
          opacity.setValue(0);
          Animated.parallel([
            Animated.timing(translateY, { toValue: 0, duration: 280, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 1, duration: 280, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          ]).start();
        } else {
          opacity.setValue(1);
          translateY.setValue(H);
          Animated.timing(translateY, { toValue: 0, duration: 320, easing: SLIDE_IN, useNativeDriver: true }).start();
        }
      } else {
        // popped back to a parent overlay: slide the child down, reveal parent at rest
        Animated.timing(translateY, { toValue: H, duration: 260, easing: SLIDE_OUT, useNativeDriver: true }).start(({ finished }) => {
          if (finished) { setFull(topFull); translateY.setValue(0); opacity.setValue(1); }
        });
      }
    } else if (!topFull && full) {
      Animated.timing(translateY, { toValue: H, duration: 260, easing: SLIDE_OUT, useNativeDriver: true }).start(({ finished }) => finished && setFull(null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topFull, overlays.length]);

  // Sheet overlays: mount while open, keep mounted through the slide-down exit.
  useEffect(() => {
    if (topSheet && topSheet !== sheet) {
      setSheet(topSheet);
      setSheetVisible(true);
    } else if (!topSheet && sheet) {
      setSheetVisible(false);
      const t = setTimeout(() => setSheet(null), 320);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topSheet]);

  // Android hardware back closes the active overlay.
  useEffect(() => {
    if (!top) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeOverlay();
      return true;
    });
    return () => sub.remove();
  }, [top, closeOverlay]);

  const FullComp = full ? FULL[full.name] : null;
  const SheetComp = sheet ? SHEET[sheet.name] : null;

  return (
    <>
      {FullComp && full && (
        <Animated.View style={[styles.full, { opacity, transform: [{ translateY }] }]}>
          <FullComp key={full.name} param={full.param} />
        </Animated.View>
      )}
      {/* Reward mounts directly (no slide container): it fades its scrim and pops its
          card itself, matching the proto reward popup. */}
      {rewardOpen && <RewardOverlay key="reward" param={top?.param} />}
      {SheetComp && sheet && (
        <SheetComp key={sheet.name} param={sheet.param} visible={sheetVisible} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  full: { position: 'absolute', inset: 0, zIndex: 50 } as any,
});
