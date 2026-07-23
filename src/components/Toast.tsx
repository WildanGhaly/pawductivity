import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Image, View } from 'react-native';
import { useStore } from '../store/store';
import { colors, radius, shadow } from '../theme/tokens';
import { Txt } from './ui';
import { img } from '../assets/registry';

// Global toast, driven by store.toast. Shows for ~2.2s then fades.
export function Toast() {
  const toast = useStore((s) => s.toast);
  const [current, setCurrent] = useState(toast);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (!toast) return;
    setCurrent(toast);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 7 }),
    ]).start();
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 20, duration: 220, useNativeDriver: true }),
      ]).start();
    }, 2200);
    return () => clearTimeout(t);
  }, [toast]);

  if (!current) return null;
  return (
    <Animated.View pointerEvents="none" style={[styles.wrap, { opacity, transform: [{ translateY }] }]}>
      <View style={styles.pill}>
        {current.coin && <Image source={img.coin} style={{ width: 18, height: 18 }} />}
        <Txt weight={700} size={13} color="#fff">{current.text}</Txt>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 96, alignItems: 'center', zIndex: 100 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: 'rgba(12,76,96,.95)', paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: radius.pill, maxWidth: '86%', ...shadow.card,
  },
});
