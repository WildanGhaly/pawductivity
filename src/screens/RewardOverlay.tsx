import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../theme/tokens';
import { Txt, Btn } from '../components/ui';
import { Icon } from '../components/Icon';
import { img } from '../assets/registry';
import { useStore } from '../store/store';
import { nextMilestone, money } from '../domain/mechanics';

// Custom full-screen celebration shown after a focus session banks. Ported 1:1 from the
// prototype showReward()/#reward markup (proto.clean.js 895-911, proto.css .rewardcard).
// Not built on OverlayScreen: it is a centered popup card over a dim teal backdrop.
export function RewardOverlay({
  param,
}: {
  param?: { coins?: number; bonus?: number; mins?: number; questName?: string };
}) {
  const insets = useSafeAreaInsets();
  const s = useStore((st) => st.state)!;
  const closeOverlay = useStore((st) => st.closeOverlay);

  const coins = param?.coins ?? 0;
  const bonus = param?.bonus ?? 0;
  const mins = param?.mins ?? 0;
  const questName = param?.questName ?? '';
  const gain = coins + bonus;

  const petName = s.pet.name;
  const nm = nextMilestone(s.pet);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.card}>
        <View style={styles.burst}>
          <Icon name="trophy" size={52} color={colors.yellow2} strokeWidth={2} />
        </View>

        <Txt weight={800} size={23} color={colors.tealInk} style={styles.h2}>Quest complete</Txt>
        {!!questName && (
          <Txt weight={600} size={14} color={colors.muted} style={styles.sub}>{questName}</Txt>
        )}

        <View style={styles.stats}>
          <View style={styles.rs}>
            <View style={styles.rv}>
              <Image source={img.coin} style={styles.rvImg} />
              <Txt weight={800} size={22} color={colors.tealInk}>+{gain}</Txt>
            </View>
            <Txt weight={700} size={10.5} color={colors.muted} style={styles.rl}>COINS EARNED</Txt>
          </View>
          <View style={styles.rs}>
            <View style={styles.rv}>
              <Icon name="clock" size={18} color={colors.good} strokeWidth={2.2} />
              <Txt weight={800} size={22} color={colors.tealInk}>{mins}</Txt>
            </View>
            <Txt weight={700} size={10.5} color={colors.muted} style={styles.rl}>MINUTES FOCUSED</Txt>
          </View>
        </View>

        {bonus > 0 ? (
          <View style={styles.bonus}>
            <Icon name="bolt" size={14} color={colors.orange2} />
            <Txt weight={700} size={12.5} color={colors.orange2} style={styles.bonusTxt}>
              +{bonus} bonus from {petName} being happy
            </Txt>
          </View>
        ) : (
          <View style={[styles.bonus, styles.bonusMuted]}>
            <Txt weight={600} size={12.5} color={colors.muted} style={styles.bonusTxt}>
              Feed {petName} to earn a focus bonus next time
            </Txt>
          </View>
        )}

        <Txt weight={700} size={12} color={colors.muted} style={styles.goal}>
          {nm
            ? `${money(s.profile.coins)} / ${nm.cost} coins toward ${nm.name}`
            : `${petName}'s dream home is complete`}
        </Txt>

        <Btn title="Continue" variant="orange" block onPress={closeOverlay} style={styles.btn} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 70,
    backgroundColor: 'rgba(11,37,48,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 26,
    paddingVertical: 28,
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 20 },
    elevation: 12,
  },
  burst: { marginBottom: 2 },
  h2: { marginTop: 6, marginBottom: 3, textAlign: 'center' },
  sub: { marginBottom: 18, textAlign: 'center' },
  stats: { flexDirection: 'row', gap: 12, justifyContent: 'center', marginBottom: 20 },
  rs: {
    backgroundColor: colors.cream,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
  },
  rv: { flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center' },
  rvImg: { width: 20, height: 20 },
  rl: { textTransform: 'uppercase', marginTop: 2, textAlign: 'center' },
  bonus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    backgroundColor: '#FFF4E7',
    borderWidth: 1,
    borderColor: '#F6DFC4',
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 12,
  },
  bonusMuted: { backgroundColor: colors.cream, borderColor: colors.line2 },
  bonusTxt: { lineHeight: 16, flexShrink: 1, textAlign: 'center' },
  goal: { marginTop: 11, textAlign: 'center' },
  btn: { marginTop: 16, width: '100%' },
});
