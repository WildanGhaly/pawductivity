import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, StyleSheet, Easing } from 'react-native';
import { radius, shadow } from '../theme/tokens';
import { Txt } from './ui';
import { img } from '../assets/registry';

// Coins physically pile up around the pet the longer you are away (proto coinPile()).
// Each spot carries a rotation `r`; the pile shows ceil(pending/3) coins (max 12).
const COIN_SPOTS = [
  { l: 47, b: 5, s: 30, r: 0 }, { l: 37, b: 7, s: 26, r: -10 }, { l: 57, b: 6, s: 27, r: 11 },
  { l: 30, b: 13, s: 22, r: -16 }, { l: 64, b: 13, s: 22, r: 14 }, { l: 50, b: 16, s: 24, r: 5 },
  { l: 41, b: 20, s: 20, r: -7 }, { l: 59, b: 22, s: 20, r: 16 }, { l: 33, b: 3, s: 23, r: 8 },
  { l: 67, b: 3, s: 23, r: -12 }, { l: 49, b: 27, s: 18, r: 0 }, { l: 44, b: 11, s: 26, r: -5 },
];

// One piled coin: pops in (opacity + scale .5->1 + rise, staggered by index, proto coinpop)
// then bobs up/down forever (proto coinbob 2.6s).
function PileCoin({ spot, index }: { spot: (typeof COIN_SPOTS)[number]; index: number }) {
  const pop = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(pop, {
      toValue: 1, duration: 420, delay: index * 50, easing: Easing.out(Easing.quad), useNativeDriver: true,
    }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const translateY = Animated.add(
    pop.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }),
    bob.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }),
  );
  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  return (
    <Animated.Image
      source={img.coin}
      style={{
        position: 'absolute', left: `${spot.l}%`, bottom: spot.b, width: spot.s, height: spot.s, zIndex: 4,
        opacity: pop,
        transform: [{ rotate: `${spot.r}deg` }, { translateY }, { scale }],
      }}
    />
  );
}

// Overlay of piled coins + the "N · tap to collect" badge, filling the pet room.
// pointerEvents is none so taps fall through to the room's collect handler.
export function CoinPile({ pending }: { pending: number }) {
  if (pending <= 0) return null;
  const n = Math.min(COIN_SPOTS.length, Math.max(1, Math.ceil(pending / 3)));
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {COIN_SPOTS.slice(0, n).map((spot, i) => (
        <PileCoin key={i} spot={spot} index={i} />
      ))}
      <View style={styles.pileBadge}>
        <Image source={img.coin} style={{ width: 15, height: 15 }} />
        <Txt weight={800} size={11.5} color="#fff">{pending} · tap to collect</Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pileBadge: {
    position: 'absolute', top: 12, alignSelf: 'center', zIndex: 5, flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(12,76,96,.92)', paddingVertical: 5, paddingHorizontal: 11, borderRadius: radius.pill, ...shadow.sm,
  },
});
