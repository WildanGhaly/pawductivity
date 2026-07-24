import React from 'react';
import { View, StyleSheet, Pressable, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadow } from '../theme/tokens';
import { Txt } from '../components/ui';
import { Icon } from '../components/Icon';
import { OverlayScreen } from '../components/OverlayScreen';
import { img } from '../assets/registry';
import { useStore } from '../store/store';
import { ACCENTS } from '../domain/catalogs';

const ROOMS = [
  { name: 'Cozy room', bg: img.room1 },
  { name: 'Meadow', bg: img.room2 },
];

export function AppearanceScreen() {
  const s = useStore((st) => st.state)!;
  const setAccent = useStore((st) => st.setAccent);
  const setRoom = useStore((st) => st.setRoom);
  const showToast = useStore((st) => st.showToast);

  const pickAccent = (i: number) => {
    if (ACCENTS[i].premium && !s.profile.premium) {
      showToast('That color is a Premium theme');
      return;
    }
    setAccent(i);
  };

  return (
    <OverlayScreen title="Appearance">
      <Txt weight={600} size={13.5} color={colors.muted} style={{ marginBottom: 16, lineHeight: 20 }}>
        Make Pawductivity feel like yours.
      </Txt>

      <View style={styles.pglbl}>
        <Txt weight={700} size={12} color={colors.teal}>Accent color</Txt>
      </View>
      <View style={styles.swrow}>
        {ACCENTS.map((t, i) => {
          const on = s.settings.accent === i;
          const locked = t.premium && !s.profile.premium;
          return (
            <Pressable key={t.name} style={styles.sw} onPress={() => pickAccent(i)}>
              <View style={[styles.swdot, on && styles.swdotOn]}>
                <LinearGradient
                  colors={[t.a, t.b]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                {locked ? (
                  <View style={styles.swover}>
                    <Icon name="crown" size={24} color="#fff" />
                  </View>
                ) : on ? (
                  <View style={styles.swover}>
                    <Icon name="check" size={26} color="#fff" strokeWidth={3} />
                  </View>
                ) : null}
              </View>
              <Txt weight={700} size={11} color={on ? colors.tealInk : colors.muted}>{t.name}</Txt>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.pglbl, { marginTop: 16 }]}>
        <Txt weight={700} size={12} color={colors.teal}>Pet room</Txt>
      </View>
      <View style={styles.roomrow}>
        {ROOMS.map((r, i) => {
          const on = s.settings.room === i;
          return (
            <Pressable key={r.name} style={{ flex: 1 }} onPress={() => setRoom(i)}>
              <ImageBackground
                source={r.bg}
                style={[styles.roomopt, on && styles.roomoptOn]}
                imageStyle={{ borderRadius: 14 }}
              >
                {on && (
                  <View style={styles.roomck}>
                    <Icon name="check" size={14} color="#fff" strokeWidth={3} />
                  </View>
                )}
                <View style={styles.roomn}>
                  <Txt weight={700} size={11.5} color="#fff">{r.name}</Txt>
                </View>
              </ImageBackground>
            </Pressable>
          );
        })}
      </View>
    </OverlayScreen>
  );
}

const styles = StyleSheet.create({
  pglbl: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, marginLeft: 2 },
  swrow: { flexDirection: 'row', gap: 10 },
  sw: { flex: 1, alignItems: 'center', gap: 6 },
  swdot: {
    width: '100%', aspectRatio: 1, borderRadius: 14, overflow: 'hidden',
    borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center', ...shadow.sm,
  },
  swdotOn: { borderColor: colors.tealInk },
  swover: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(0,0,0,.28)',
    alignItems: 'center', justifyContent: 'center',
  },
  roomrow: { flexDirection: 'row', gap: 10 },
  roomopt: {
    height: 82, borderRadius: 14, overflow: 'hidden', justifyContent: 'flex-end',
    borderWidth: 2, borderColor: 'transparent', ...shadow.sm,
  },
  roomoptOn: { borderColor: colors.tealInk },
  roomn: { width: '100%', backgroundColor: 'rgba(0,0,0,.4)', paddingVertical: 5, paddingHorizontal: 8 },
  roomck: {
    position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center', zIndex: 2,
  },
});
