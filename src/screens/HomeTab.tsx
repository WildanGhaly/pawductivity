import React from 'react';
import { View, ScrollView, StyleSheet, Pressable, Image, ImageBackground } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { colors, radius, shadow, NAV_H, moodColors } from '../theme/tokens';
import { Txt, Card, CoinPill } from '../components/ui';
import { Icon } from '../components/Icon';
import { PetView } from '../components/PetView';
import { QuestRow } from '../components/QuestRow';
import { img, avatars } from '../assets/registry';
import { useStore } from '../store/store';
import { moodOf, bonusPct, idlePending, nextMilestone, homePct, isDone, fmt, moodRate } from '../domain/mechanics';
import { TabKey } from '../components/TabBar';

const COIN_SPOTS = [
  { l: 47, b: 5, s: 30 }, { l: 37, b: 7, s: 26 }, { l: 57, b: 6, s: 27 },
  { l: 30, b: 13, s: 22 }, { l: 64, b: 13, s: 22 }, { l: 50, b: 16, s: 24 },
  { l: 41, b: 20, s: 20 }, { l: 59, b: 22, s: 20 }, { l: 33, b: 3, s: 23 },
  { l: 67, b: 3, s: 23 }, { l: 49, b: 27, s: 18 }, { l: 44, b: 11, s: 26 },
];

export function HomeTab({ onTab }: { onTab: (t: TabKey) => void }) {
  const insets = useSafeAreaInsets();
  const s = useStore((st) => st.state)!;
  const collectIdle = useStore((st) => st.collectIdle);
  const showToast = useStore((st) => st.showToast);
  const soon = (m = 'Coming soon') => showToast(m);

  const p = s.profile;
  const mood = moodOf(s.pet.health);
  const bp = bonusPct(s.pet.health);
  const active = s.quests.filter((q) => !isDone(q));
  const planned = s.plan.length ? s.plan.map((id) => active.find((q) => q.id === id)).filter(Boolean) as typeof active : active.slice();
  const today = planned.slice().sort((a, b) => a.est - b.est).slice(0, 3);
  const goalPct = Math.min(100, Math.round((s.today.min / s.today.goalMin) * 100));
  const pending = idlePending(s.pet);
  const nm = nextMilestone(s.pet);

  const weekly = s.insights.weekly;
  const wkMax = Math.max(...weekly, 1);
  const wkTotal = weekly.reduce((a, b) => a + b, 0);
  const dows = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const bestName = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][weekly.indexOf(wkMax)];

  const ringR = 35;
  const ringC = 2 * Math.PI * ringR;

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: NAV_H + insets.bottom + 20 }} showsVerticalScrollIndicator={false}>
      {/* top bar */}
      <View style={[styles.topbar, { paddingTop: Math.max(20, insets.top + 12) }]}>
        <Pressable onPress={() => soon('Profile coming soon')} style={styles.avatar}>
          <Image source={avatars[p.avatar] || img.catThumb} style={styles.avatarImg} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Txt weight={600} size={12} color={colors.muted}>Welcome back</Txt>
          <Txt weight={800} size={20} color={colors.tealInk}>Hi, {p.name}</Txt>
        </View>
        <CoinPill amount={p.coins} />
      </View>

      <View style={styles.pad}>
        {/* capture entry */}
        <Pressable style={styles.capture} onPress={() => soon('Quick add coming soon')}>
          <View style={styles.ceIc}><Icon name="note" size={22} color="#fff" /></View>
          <View style={{ flex: 1 }}>
            <Txt weight={800} size={15} color="#fff">What do you want to get done?</Txt>
            <Txt size={12} color={colors.sky} style={{ marginTop: 2, lineHeight: 16 }}>Jot it down and we'll shape it into focus quests</Txt>
          </View>
          <View style={styles.cePlus}><Icon name="plus" size={20} color="#fff" /></View>
        </Pressable>

        {/* pet room */}
        <Pressable onPress={pending > 0 ? collectIdle : undefined}>
          <ImageBackground source={img.room1} style={styles.room} imageStyle={{ borderRadius: 22 }}>
            <View style={styles.moodtag}>
              <View style={[styles.mooddot, { backgroundColor: moodColors[mood.k] }]} />
              <Txt weight={700} size={12} color={colors.tealInk}>{mood.t}</Txt>
            </View>
            <View style={styles.petShadow} />
            <View style={styles.petStage}>
              <PetView species={s.pet.species} clothesId={s.pet.clothesId} size={200} speed={moodRate(s.pet.health) < 0.5 ? 0.7 : 1} />
            </View>
            {pending > 0 && (
              <>
                {COIN_SPOTS.slice(0, Math.min(COIN_SPOTS.length, Math.max(1, Math.ceil(pending / 3)))).map((c, i) => (
                  <Image key={i} source={img.coin} style={{ position: 'absolute', left: `${c.l}%`, bottom: c.b, width: c.s, height: c.s }} />
                ))}
                <View style={styles.pileBadge}>
                  <Image source={img.coin} style={{ width: 15, height: 15 }} />
                  <Txt weight={800} size={11.5} color="#fff">{pending} · tap to collect</Txt>
                </View>
              </>
            )}
          </ImageBackground>
        </Pressable>

        {/* pet care card */}
        <Card style={styles.careCard}>
          <View style={styles.spread}>
            <Txt weight={800} color={colors.tealInk}>{s.pet.name}</Txt>
            {bp > 0 ? (
              <View style={styles.bonuspill}>
                <Icon name="bolt" size={14} color={colors.orange} />
                <Txt weight={800} size={12} color={colors.orange2}>+{bp}% focus reward</Txt>
              </View>
            ) : (
              <Txt weight={600} size={12} color={colors.muted}>Feed to boost rewards</Txt>
            )}
          </View>
          <View style={styles.health}>
            <Icon name="heart" size={16} color="#E5654B" />
            <View style={styles.healthBar}>
              <View style={[styles.healthFill, { width: `${s.pet.health}%`, backgroundColor: s.pet.health < 40 ? '#E5654B' : colors.yellow2 }]} />
            </View>
            <Txt weight={800} size={13} color={colors.tealInk} style={{ minWidth: 52, textAlign: 'right' }}>{s.pet.health}/100</Txt>
          </View>
          <View style={styles.carerow}>
            <CareBtn icon={img.apple} label="Feed" onPress={() => soon('Feed sheet coming soon')} />
            <CareBtn icon={img.wardrobe} label="Dress" onPress={() => onTab('pet')} />
            <CareBtn icon={img.shop} label="Shop" onPress={() => soon('Shop coming soon')} />
          </View>
        </Card>

        {/* journey strip */}
        <Pressable style={styles.jstrip} onPress={() => soon("Pixel's journey coming soon")}>
          <View style={styles.jstripIc}><Icon name={(nm?.ic as any) || 'crown'} size={16} color="#8580B0" /></View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt weight={800} size={13} color={colors.tealInk} numberOfLines={1}>
              {nm ? `Building ${s.pet.name}'s home: ${nm.name}` : `${s.pet.name}'s dream home is complete`}
            </Txt>
            <View style={styles.jprogbar}>
              <View style={[styles.jprogfill, { width: `${homePct(s.pet)}%` }]} />
            </View>
          </View>
          <Icon name="chevR" size={15} color={colors.muted} />
        </Pressable>

        {/* goal card */}
        <Card style={styles.goalcard} onPress={() => soon('Daily goal coming soon')}>
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

        {/* your week */}
        <View style={styles.shead}>
          <Txt weight={700} size={16} color={colors.tealInk}>Your week</Txt>
          <Txt weight={700} size={12.5} color={colors.orange} onPress={() => soon('Insights coming soon')}>{p.premium ? 'Full dashboard' : 'See more'}</Txt>
        </View>
        <Card style={{ padding: 16 }}>
          <View style={styles.spread}>
            <View>
              <Txt weight={700} size={12} color={colors.muted}>Focus this week</Txt>
              <Txt weight={800} size={22} color={colors.tealInk} style={{ marginTop: 2 }}>{fmt(wkTotal * 60)}</Txt>
            </View>
            <View style={styles.wktag}>
              <Icon name="clock" size={13} color={colors.orange} />
              <Txt weight={700} size={11} color={colors.muted}>Best in the {s.insights.bestFocus.toLowerCase()}</Txt>
            </View>
          </View>
          <View style={styles.wkbars}>
            {weekly.map((m, i) => (
              <View key={i} style={styles.wkcol}>
                <View style={[styles.wkbar, { height: `${Math.max(8, Math.round((m / wkMax) * 100))}%` }]} />
                <Txt weight={700} size={10.5} color={colors.line2}>{dows[i]}</Txt>
              </View>
            ))}
          </View>
          <Txt weight={600} size={12} color={colors.muted} style={{ lineHeight: 17 }}>{bestName} was your strongest day. Tap for the full breakdown.</Txt>
        </Card>

        {/* today's focus */}
        <View style={styles.shead}>
          <Txt weight={700} size={16} color={colors.tealInk}>Today's focus</Txt>
          <Txt weight={700} size={12.5} color={colors.orange} onPress={() => soon('Plan coming soon')}>Plan</Txt>
        </View>
        {today.length ? (
          today.map((q, i) => <QuestRow key={q.id} quest={q} startHere={i === 0} onStart={() => soon('Focus timer coming soon')} />)
        ) : (
          <Card style={{ padding: 22, alignItems: 'center' }}>
            <Icon name="checkCircle" size={30} color={colors.good} />
            <Txt weight={700} color={colors.tealInk} style={{ marginTop: 8 }}>All clear for today</Txt>
            <Txt size={13} color={colors.muted} style={{ marginTop: 2 }}>Add a quest to keep your streak alive.</Txt>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

function CareBtn({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.carebtn} onPress={onPress}>
      <Image source={icon} style={{ width: 34, height: 34 }} resizeMode="contain" />
      <Txt weight={700} size={11.5} color={colors.tealInk}>{label}</Txt>
    </Pressable>
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
  avatar: {},
  avatarImg: { width: 44, height: 44, borderRadius: 22, borderWidth: 2.5, borderColor: '#fff', backgroundColor: '#DDEDE9' },
  pad: { paddingHorizontal: 16, paddingTop: 6 },
  capture: {
    flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: colors.teal,
    borderRadius: radius.lg, padding: 15, marginBottom: 16, ...shadow.card,
  },
  ceIc: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.14)', alignItems: 'center', justifyContent: 'center' },
  cePlus: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' },
  room: { height: 250, borderRadius: 22, overflow: 'hidden', justifyContent: 'flex-end' },
  moodtag: {
    position: 'absolute', top: 12, left: 12, zIndex: 3, flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,.92)', paddingVertical: 5, paddingHorizontal: 11, borderRadius: radius.pill,
  },
  mooddot: { width: 8, height: 8, borderRadius: 4 },
  petShadow: { position: 'absolute', bottom: 20, alignSelf: 'center', width: 120, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,.14)', zIndex: 1 },
  petStage: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 200, alignItems: 'center', justifyContent: 'flex-end', zIndex: 2 },
  pileBadge: {
    position: 'absolute', top: 12, alignSelf: 'center', zIndex: 5, flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(12,76,96,.92)', paddingVertical: 5, paddingHorizontal: 11, borderRadius: radius.pill,
  },
  careCard: { padding: 16, marginTop: -24, zIndex: 3 },
  spread: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  bonuspill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF4E7',
    borderWidth: 1, borderColor: '#F6DFC4', paddingVertical: 5, paddingHorizontal: 11, borderRadius: radius.pill,
  },
  health: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  healthBar: { flex: 1, height: 13, borderRadius: 9, backgroundColor: '#EFE7D6', overflow: 'hidden' },
  healthFill: { height: '100%', borderRadius: 9 },
  carerow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  carebtn: {
    flex: 1, alignItems: 'center', gap: 4, paddingVertical: 12, paddingHorizontal: 8, borderRadius: radius.md,
    backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, ...shadow.sm,
  },
  jstrip: {
    flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 16, padding: 12, borderRadius: radius.md,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, ...shadow.sm,
  },
  jstripIc: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F1EAFB', alignItems: 'center', justifyContent: 'center' },
  jprogbar: { height: 9, borderRadius: 999, backgroundColor: '#EFE7D6', overflow: 'hidden', marginTop: 7 },
  jprogfill: { height: '100%', borderRadius: 999, backgroundColor: '#8580B0' },
  goalcard: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, marginTop: 16 },
  goalRingWrap: { width: 88, height: 88 },
  goalCtr: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' } as any,
  goalChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 9 },
  gchip: {
    flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.cream, borderWidth: 1,
    borderColor: colors.line2, paddingVertical: 4, paddingHorizontal: 9, borderRadius: radius.pill,
  },
  shead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 12, marginHorizontal: 2 },
  wktag: {
    flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.cream, borderWidth: 1,
    borderColor: colors.line2, paddingVertical: 5, paddingHorizontal: 10, borderRadius: radius.pill,
  },
  wkbars: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 104, marginVertical: 12 },
  wkcol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 7 },
  wkbar: { width: '100%', maxWidth: 26, minHeight: 10, backgroundColor: colors.teal2, borderTopLeftRadius: 6, borderTopRightRadius: 6, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
});
