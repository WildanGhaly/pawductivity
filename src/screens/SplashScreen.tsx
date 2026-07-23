import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Txt } from '../components/ui';
import { img } from '../assets/registry';
import { font } from '../theme/tokens';

const SPLASH_LINES = [
  'Small sessions beat big intentions.',
  'Start before you feel ready.',
  'Twenty focused minutes still counts.',
  'Momentum is built, not found.',
  'The hardest part is the first minute.',
  'Done is quieter than perfect.',
  'Consistency is just showing up again.',
  'Progress hides inside ordinary days.',
  'Rest is part of the work.',
  'One thing at a time, on purpose.',
  'Focus is a skill, not a mood.',
  'Begin small enough to actually begin.',
  'A quiet hour is worth protecting.',
  'Slow days still move you forward.',
  'Finish one small thing today.',
  'Showing up is most of the trick.',
];

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const quote = useRef(SPLASH_LINES[Math.floor(Math.random() * SPLASH_LINES.length)]).current;
  const pop = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const load = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
    Animated.loop(
      Animated.timing(load, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ).start();
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, []);

  const trackW = 120;
  const barTranslate = load.interpolate({ inputRange: [0, 1], outputRange: [-trackW * 0.4, trackW] });
  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.06] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.62] });

  return (
    <LinearGradient colors={['#0C4C60', '#0a3d4e']} style={styles.root}>
      <Animated.Image
        source={img.logoGlow}
        style={[styles.glow, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]}
        resizeMode="contain"
      />
      <Animated.View style={{ transform: [{ scale: pop }], opacity: pop, zIndex: 2 }}>
        <Image source={img.logo} style={styles.logo} resizeMode="contain" />
      </Animated.View>
      <Txt weight={800} size={30} color="#fff" style={{ marginTop: 18, letterSpacing: 0.5, zIndex: 2 }}>
        Pawductivity
      </Txt>
      <Txt weight={600} size={13.5} color="#BFE3F3" style={{ marginTop: 2, zIndex: 2 }}>
        Get things done. Grow a friend.
      </Txt>
      <Txt
        size={13}
        color="#8FC0CC"
        style={{ position: 'absolute', bottom: 104, left: 30, right: 30, textAlign: 'center', fontFamily: font.regular }}
      >
        {quote}
      </Txt>
      <View style={styles.loader}>
        <Animated.View style={[styles.loaderBar, { transform: [{ translateX: barTranslate }] }]} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 340, height: 340 },
  logo: { width: 120, height: 120 },
  loader: {
    position: 'absolute',
    bottom: 70,
    width: 120,
    height: 5,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,.18)',
    overflow: 'hidden',
  },
  loaderBar: { position: 'absolute', width: '40%', height: '100%', backgroundColor: '#E28A4B', borderRadius: 9 },
});

export { SPLASH_LINES };
