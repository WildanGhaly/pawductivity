import React from 'react';
import { View, ScrollView, StyleSheet, Pressable, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { colors, radius, shadow, NAV_H } from '../theme/tokens';
import { Txt, Card, CoinPill } from '../components/ui';
import { Icon } from '../components/Icon';
import { QuestRow } from '../components/QuestRow';
import { img, avatars } from '../assets/registry';
import { useStore } from '../store/store';
import { isDone, fmt } from '../domain/mechanics';
import { Quest } from '../domain/types';

export function QuestsTab({ onTab }: { onTab: (t: 'home' | 'quests' | 'pet' | 'cal') => void }) {
  const insets = useSafeAreaInsets();
  const s = useStore((st) => st.state)!;
  const openOverlay = useStore((st) => st.openOverlay);

  const p = s.profile;
  const active = s.quests.filter((q) => !isDone(q));
  const done = s.quests.filter((q) => isDone(q));
  const planned = (s.plan.length
    ? s.plan.map((id) => active.find((q) => q.id === id)).filter(Boolean)
    : []) as Quest[];

  const goalPct = Math.min(100, Math.round((s.today.min / s.today.goalMin) * 100));
  const ringR = 35;
  const ringC = 2 * Math.PI * ringR;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: NAV_H + insets.bottom + 20 }}
      showsVerticalScrollIndicator={false}
    >
      {/* top bar */}
      <View style={[styles.topbar, { paddingTop: Math.max(20, insets.top + 12) }]}>
        <Pressable onPress={() => openOverlay('profile')}>
          <Image source={avatars[p.avatar] || img.catThumb} style={styles.avatarImg} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Txt weight={600} size={12} color={colors.muted}>{active.length} to go · {done.length} done today</Txt>
          <Txt weight={800} size={20} color={colors.tealInk}>Your Quests</Txt>
        </View>
        <CoinPill amount={p.coins} />
      </View>

      <View style={styles.pad}>
        {/* capture entry */}
        <Pressable style={styles.capture} onPress={() => openOverlay('capture')}>
          <View style={styles.ceIc}><Icon name="note" size={22} color="#fff" /></View>
          <View style={{ flex: 1 }}>
            <Txt weight={800} size={15} color="#fff">Add a quest</Txt>
            <Txt size={12} color={colors.sky} style={{ marginTop: 2, lineHeight: 16 }}>Pick a time and tag, or brain-dump a whole list</Txt>
          </View>
          <View style={styles.cePlus}><Icon name="plus" size={20} color="#fff" /></View>
        </Pressable>

        {/* daily goal card */}
        <Card style={styles.goalcard} onPress={() => openOverlay('goal')}>
          <View style={styles.goalRingWrap}>
            <Svg width={88} height={88}>
              <Circle cx={44} cy={44} r={ringR} fill="none" stroke="#EFE7D6" strokeWidth={8} />
              <Circle cx={44} cy={44} r={ringR} fill="none" stroke={colors.teal} strokeWidth={8} strokeLinecap="round"
                strokeDasharray={`${ringC}`} strokeDashoffset={ringC * (1 - goalPct / 100)} transform="rotate(-90 44 44)" />
            </Svg>
            <View style={styles.goalCtr}>
              <Txt weight={800} size={20} color={colors.tealInk}>{s.today.min}</Txt>
              <Txt weight={700} size={10.5} color={colors.muted}>/ {s.today.goalMin}m</Txt>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Txt weight={800} size={15} color={colors.tealInk}>Today's focus goal</Txt>
            <Txt weight={600} size={12.5} color={colors.muted} style={{ marginTop: 2 }}>
              {s.today.min >= s.today.goalMin ? 'Reached, great work today' : `${s.today.goalMin - s.today.min} min to go`}
            </Txt>
            <View style={styles.goalChips}>
              <GChip icon="flame" text={`${s.streak.current} day streak`} />
              <GChip icon="checkCircle" text={`${s.today.sessions} today`} />
            </View>
          </View>
        </Card>

        {/* today's plan */}
        <View style={styles.shead}>
          <Txt weight={700} size={16} color={colors.tealInk}>Today's plan</Txt>
          <Txt weight={700} size={12.5} color={colors.orange} onPress={() => openOverlay('plan')}>Plan</Txt>
        </View>
        <Card style={styles.planCard} onPress={() => openOverlay('plan')}>
          {planned.length ? (
            planned.map((q, i) => (
              <View key={q.id} style={[styles.planrow, i === planned.length - 1 && { marginBottom: 0 }]}>
                <View style={styles.planck}><Icon name="check" size={14} color="#fff" /></View>
                <Txt weight={700} size={13.5} color={colors.tealInk} numberOfLines={1} style={{ flex: 1 }}>{q.name}</Txt>
                <View style={styles.planTime}>
                  <Icon name="clock" size={12} color="#9A968A" />
                  <Txt weight={600} size={12} color={colors.muted}>{fmt(q.est)}</Txt>
                </View>
              </View>
            ))
          ) : (
            <Txt weight={600} size={12.5} color={colors.muted} style={{ lineHeight: 18 }}>
              Pick up to 3 to focus on today. We'll line them up smallest first, so starting is easy.
            </Txt>
          )}
        </Card>

        {/* in progress */}
        <View style={styles.shead}>
          <Txt weight={700} size={16} color={colors.tealInk}>In progress</Txt>
          <Txt weight={600} size={12.5} color={colors.muted}>{active.length}</Txt>
        </View>
        {active.length ? (
          active.map((q) => (
            <QuestRow key={q.id} quest={q} onStart={(id) => openOverlay('focus', { questId: id })} />
          ))
        ) : (
          <View style={styles.empty}>
            <View style={styles.emIc}><Icon name="sprout" size={40} color={colors.grass} /></View>
            <Txt weight={700} size={15} color={colors.tealInk}>Nothing here yet</Txt>
            <Txt size={13} color={colors.muted} style={{ marginTop: 4, lineHeight: 20, textAlign: 'center' }}>
              Tap the card above (or the + button) to add your first quest.
            </Txt>
          </View>
        )}

        {/* completed today */}
        {done.length ? (
          <>
            <View style={styles.shead}>
              <Txt weight={700} size={16} color={colors.tealInk}>Completed today</Txt>
              <Txt weight={600} size={12.5} color={colors.muted}>{done.length}</Txt>
            </View>
            {done.map((q) => (
              <QuestRow key={q.id} quest={q} onStart={(id) => openOverlay('focus', { questId: id })} />
            ))}
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

function GChip({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={styles.gchip}>
      <Icon name={icon} size={13} color={colors.orange} />
      <Txt weight={700} size={11} color={colors.muted}>{text}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 8 },
  avatarImg: { width: 44, height: 44, borderRadius: 22, borderWidth: 2.5, borderColor: '#fff', backgroundColor: '#DDEDE9' },
  pad: { paddingHorizontal: 16, paddingTop: 6 },
  capture: {
    flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: colors.teal,
    borderRadius: radius.lg, padding: 15, marginBottom: 16, ...shadow.card,
  },
  ceIc: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.14)', alignItems: 'center', justifyContent: 'center' },
  cePlus: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' },
  goalcard: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16 },
  goalRingWrap: { width: 88, height: 88 },
  goalCtr: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' } as any,
  goalChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 9 },
  gchip: {
    flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.cream, borderWidth: 1,
    borderColor: colors.line2, paddingVertical: 4, paddingHorizontal: 9, borderRadius: radius.pill,
  },
  shead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 12, marginHorizontal: 2 },
  planCard: { padding: 14 },
  planrow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, paddingHorizontal: 12,
    borderRadius: 13, backgroundColor: '#F1F7F9', borderWidth: 1.5, borderColor: colors.teal, marginBottom: 8,
  },
  planck: { width: 22, height: 22, borderRadius: 7, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center' },
  planTime: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  empty: { alignItems: 'center', paddingVertical: 34, paddingHorizontal: 20 },
  emIc: { marginBottom: 8 },
});
