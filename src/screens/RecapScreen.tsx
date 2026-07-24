import React from 'react';
import { View, StyleSheet, Pressable, Image, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadow } from '../theme/tokens';
import { catColors } from '../theme/tokens';
import { Txt, Card } from '../components/ui';
import { Icon } from '../components/Icon';
import { PetView } from '../components/PetView';
import { OverlayScreen } from '../components/OverlayScreen';
import { img } from '../assets/registry';
import { useStore } from '../store/store';
import { fmt, money, stageName, petStage } from '../domain/mechanics';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DOW2 = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function recapRange(): string {
  const n = new Date();
  const end = new Date(n);
  const start = new Date(n);
  start.setDate(n.getDate() - 6);
  const mo = MONTHS_SHORT;
  return `${mo[start.getMonth()]} ${start.getDate()} to ${mo[end.getMonth()]} ${end.getDate()}`;
}

function recapVerdict(delta: number, petName: string, hasData: boolean): { t: string; s: string } {
  // A brand new user (no focus this week or last) has not built a habit to be
  // "steady" about, so the delta===0 verdict below would misread zero activity as
  // a maintained streak on a card the app invites them to share.
  if (!hasData) return { t: 'Your first week starts now', s: `Finish one focus session and ${petName}'s recap fills in from here.` };
  if (delta >= 25) return { t: 'Your strongest week in a while', s: 'You showed up more than usual. That is how habits stick.' };
  if (delta > 0) return { t: 'Better than last week', s: 'Small gains add up. Keep the same rhythm.' };
  if (delta === 0) return { t: 'Steady as ever', s: 'Consistency beats intensity. This is a good place to be.' };
  if (delta > -25) return { t: 'A lighter week', s: 'Lighter weeks are normal. One session gets you moving again.' };
  return { t: 'A quiet week', s: `${petName} missed you. Start with fifteen minutes tomorrow.` };
}

export function RecapScreen() {
  const s = useStore((st) => st.state)!;
  const showToast = useStore((st) => st.showToast);
  const openOverlay = useStore((st) => st.openOverlay);

  const ins = s.insights;
  const petName = s.pet.name;
  const stg = petStage(s.pet);
  const total = ins.weekly.reduce((a, b) => a + b, 0);
  const hasData = total > 0; // a brand new week has no best-day or category yet
  const max = Math.max(...ins.weekly, 1);
  const bestIdx = ins.weekly.indexOf(Math.max(...ins.weekly, 0));
  const bestDay = hasData && bestIdx >= 0 ? DAY_FULL[bestIdx] : '-';
  const delta = Math.round(((total - ins.lastWeekTotal) / Math.max(1, ins.lastWeekTotal)) * 100);
  const v = recapVerdict(delta, petName, hasData);
  const topCat = ins.categories[0]; // may be undefined for a fresh user
  const avg = ins.avgLen;

  const lastMax = Math.max(total, ins.lastWeekTotal, 1);
  const weekGoal = s.today.goalMin * 7;
  const gap = weekGoal - total;
  const nextTarget = total >= weekGoal ? Math.max(Math.round((total * 1.1) / 10) * 10, weekGoal + 10) : weekGoal;
  const moreSessions = Math.max(1, Math.ceil(gap / Math.max(1, avg)));
  const nextWhy = total >= weekGoal
    ? `You already cleared your ${fmt(weekGoal * 60)} weekly goal, so this is ten percent on top of what you actually did.`
    : total === 0
    ? `That is your ${s.today.goalMin}m daily goal across seven days. Finish one session and ${petName} starts earning.`
    : `That is your ${s.today.goalMin}m daily goal across seven days. You finished ${fmt(gap * 60)} short, roughly ${moreSessions} more session${moreSessions === 1 ? '' : 's'} at your usual ${avg}m.`;

  const summary = `My Pawductivity week (${recapRange()}): ${fmt(total * 60)} focused across ${ins.weekFocusDays} day${ins.weekFocusDays === 1 ? '' : 's'}, ${money(ins.weekCoins)} coins earned. ${petName} is ${stageName(stg)}.`;
  const share = async () => {
    try {
      await Share.share({ message: summary });
    } catch {
      showToast('Could not open the share sheet');
    }
  };
  const copy = async () => {
    try {
      await Clipboard.setStringAsync(summary);
      showToast('Summary copied');
    } catch {
      showToast('Could not copy');
    }
  };

  return (
    <OverlayScreen title="Weekly recap">
      {/* shareable card */}
      <LinearGradient colors={['#0C4C60', '#12667F']} start={{ x: 0, y: 0 }} end={{ x: 0.6, y: 1 }} style={styles.recapcard}>
        <Txt weight={800} size={10.5} color="#9FCBDD" style={styles.eyebrow}>
          {`Weekly recap  ${recapRange()}`}
        </Txt>
        <View style={styles.recappet}>
          <View style={styles.petGlow} />
          <PetView species={s.pet.species} clothesId={s.pet.clothesId} size={150} speed={1} />
        </View>
        <Txt weight={800} size={20} color="#fff" style={styles.recaphead}>{v.t}</Txt>
        <Txt weight={600} size={12.5} color="#9FCBDD" style={styles.recapsub}>
          {`${petName} is ${stageName(stg)}, stage ${stg} of 5`}
        </Txt>
        <View style={styles.recapstats}>
          <View style={styles.statCol}>
            <Txt weight={800} size={21} color="#fff">{fmt(total * 60)}</Txt>
            <Txt weight={600} size={11} color={colors.sky}>focused</Txt>
          </View>
          <View style={styles.statCol}>
            <Txt weight={800} size={21} color="#fff">{ins.sessions}</Txt>
            <Txt weight={600} size={11} color={colors.sky}>sessions</Txt>
          </View>
          <View style={styles.statCol}>
            <Txt weight={800} size={21} color="#fff">{s.streak.current}</Txt>
            <Txt weight={600} size={11} color={colors.sky}>day streak</Txt>
          </View>
        </View>
        <View style={styles.rcbars}>
          {ins.weekly.map((m, i) => (
            <View key={i} style={styles.rcbarcol}>
              <View style={styles.rctrack}>
                <View style={[styles.rcbar, hasData && i === bestIdx && styles.rcbarBest, { height: `${Math.max(6, Math.round((m / max) * 100))}%` }]} />
              </View>
              <Txt weight={700} size={10} color="#9FCBDD">{DOW2[i]}</Txt>
            </View>
          ))}
        </View>
        <Txt weight={600} size={11} color="#9FCBDD" style={styles.recapfoot}>Made with Pawductivity</Txt>
      </LinearGradient>

      {/* actions */}
      <View style={styles.actions}>
        <Pressable style={styles.shareBtn} onPress={share}>
          <Icon name="download" size={16} color="#fff" />
          <Txt weight={700} size={15} color="#fff">Save and share</Txt>
        </Pressable>
        <Pressable style={styles.copyBtn} onPress={copy}>
          <Icon name="note" size={16} color={colors.teal} />
        </Pressable>
      </View>

      {/* versus last week */}
      <View style={styles.shead}>
        <Txt weight={700} size={16} color={colors.tealInk}>Versus last week</Txt>
        <Txt weight={700} size={11} color={colors.muted}>{`${delta > 0 ? '+' : ''}${delta}%`}</Txt>
      </View>
      <Card style={styles.padCard}>
        <CmpRow label="This week" now width={Math.round((total / lastMax) * 100)} value={fmt(total * 60)} />
        <CmpRow label="Last week" width={Math.round((ins.lastWeekTotal / lastMax) * 100)} value={fmt(ins.lastWeekTotal * 60)} style={{ marginTop: 10 }} />
        <Txt weight={600} size={12} color={colors.muted} style={styles.cmpNote}>{v.s}</Txt>
      </Card>

      {/* highlights */}
      <View style={styles.shead}>
        <Txt weight={700} size={16} color={colors.tealInk}>Highlights</Txt>
      </View>
      <Card style={styles.hlCard}>
        <HlRow icon={<Icon name="trophy" size={17} color={colors.teal} />} title="Best day" value={hasData ? `${bestDay}  ${max}m` : 'No focus yet'} />
        <HlRow icon={<Icon name="clock" size={17} color={colors.teal} />} title="Longest session" value={ins.longest > 0 ? `${ins.longest}m` : '-'} />
        <HlRow icon={<Icon name="target" size={17} color={colors.teal} />} title="Days you showed up" value={`${ins.weekFocusDays} of 7`} />
        <HlRow
          icon={<View style={[styles.catdot, { backgroundColor: (topCat && catColors[topCat[0]]) || colors.teal }]} />}
          title="Most of your time"
          value={topCat ? `${topCat[0]}  ${topCat[1]}%` : 'Nothing yet'}
          last
        />
      </Card>

      {/* what pet got */}
      <View style={styles.shead}>
        <Txt weight={700} size={16} color={colors.tealInk}>{`What ${petName} got`}</Txt>
      </View>
      <View style={styles.atgrid}>
        <View style={styles.atcard}>
          <View style={styles.atic}><Image source={img.coin} style={{ width: 18, height: 18 }} /></View>
          <Txt weight={800} size={16} color={colors.tealInk}>{money(ins.weekCoins)}</Txt>
          <Txt weight={600} size={10.5} color={colors.muted} style={styles.atl}>Coins earned</Txt>
        </View>
        <View style={styles.atcard}>
          <View style={styles.atic}><Icon name="sprout" size={18} color={colors.teal} /></View>
          <Txt weight={800} size={16} color={colors.tealInk}>{ins.weekMilestones}</Txt>
          <Txt weight={600} size={10.5} color={colors.muted} style={styles.atl}>Home built</Txt>
        </View>
        <View style={styles.atcard}>
          <View style={styles.atic}><Icon name="trophy" size={18} color={colors.teal} /></View>
          <Txt weight={800} size={16} color={colors.tealInk}>{ins.weekBadges}</Txt>
          <Txt weight={600} size={10.5} color={colors.muted} style={styles.atl}>New badges</Txt>
        </View>
      </View>

      {/* next week */}
      <View style={styles.shead}>
        <Txt weight={700} size={16} color={colors.tealInk}>Next week</Txt>
      </View>
      <Card style={styles.padCard}>
        <Txt weight={800} size={15} color={colors.tealInk}>{`Aim for ${fmt(nextTarget * 60)}`}</Txt>
        <Txt weight={600} size={12} color={colors.muted} style={styles.nextWhy}>{nextWhy}</Txt>
        <CmpRow label="This week" now width={Math.min(100, Math.round((total / nextTarget) * 100))} value={fmt(total * 60)} style={{ marginTop: 13 }} />
        <CmpRow label="Target" width={100} fillColor={colors.orange} value={fmt(nextTarget * 60)} style={{ marginTop: 8 }} />
        <Pressable style={styles.adjustBtn} onPress={() => openOverlay('goal')}>
          <Txt weight={700} size={13} color={colors.teal}>Adjust my daily goal</Txt>
        </Pressable>
      </Card>

      <Txt weight={500} size={11.5} color={colors.muted} style={styles.sectionNote}>
        Only the card at the top is included when you share.
      </Txt>
    </OverlayScreen>
  );
}

function CmpRow({
  label,
  width,
  value,
  now,
  fillColor,
  style,
}: {
  label: string;
  width: number;
  value: string;
  now?: boolean;
  fillColor?: string;
  style?: any;
}) {
  return (
    <View style={[styles.cmprow, style]}>
      <Txt weight={700} size={12} color={colors.muted} style={styles.cmpl}>{label}</Txt>
      <View style={styles.cmpbar}>
        <View
          style={[
            styles.cmpfill,
            { width: `${width}%` },
            now && { backgroundColor: colors.teal2 },
            fillColor && { backgroundColor: fillColor },
          ]}
        />
      </View>
      <Txt weight={800} size={12} color={colors.tealInk} style={styles.cmpv}>{value}</Txt>
    </View>
  );
}

function HlRow({ icon, title, value, last }: { icon: React.ReactNode; title: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.hlrow, last && styles.hlrowLast]}>
      <View style={styles.hlic}>{icon}</View>
      <Txt weight={600} size={13.5} color={colors.tealInk} style={{ flex: 1 }}>{title}</Txt>
      <Txt weight={800} size={13} color={colors.tealInk}>{value}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  recapcard: { borderRadius: 22, padding: 22, alignItems: 'center', ...shadow.card },
  eyebrow: { letterSpacing: 1.1, textTransform: 'uppercase', textAlign: 'center' },
  recappet: { height: 158, alignItems: 'center', justifyContent: 'center', marginVertical: 6 },
  petGlow: { position: 'absolute', width: 172, height: 172, borderRadius: 86, backgroundColor: 'rgba(255,251,242,.92)' },
  recaphead: { marginTop: 12, textAlign: 'center', lineHeight: 26 },
  recapsub: { marginTop: 6, textAlign: 'center' },
  recapstats: { flexDirection: 'row', justifyContent: 'space-around', alignSelf: 'stretch', marginTop: 18, marginBottom: 4 },
  statCol: { alignItems: 'center' },
  rcbars: { flexDirection: 'row', gap: 7, alignSelf: 'stretch', marginTop: 16 },
  rcbarcol: { flex: 1, alignItems: 'center', gap: 7 },
  rctrack: { width: '100%', height: 54, borderRadius: 8, backgroundColor: 'rgba(255,255,255,.14)', justifyContent: 'flex-end', overflow: 'hidden' },
  rcbar: { width: '100%', borderRadius: 8, backgroundColor: 'rgba(255,255,255,.55)' },
  rcbarBest: { backgroundColor: colors.yellow },
  recapfoot: { marginTop: 14, textAlign: 'center' },

  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  shareBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.orange, borderRadius: radius.md, paddingVertical: 14, ...shadow.sm,
  },
  copyBtn: {
    width: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white,
    borderWidth: 1.5, borderColor: colors.line2, borderRadius: radius.md, paddingVertical: 14,
  },

  shead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, marginBottom: 10, marginHorizontal: 2 },
  padCard: { padding: 16 },
  cmprow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cmpl: { width: 74 },
  cmpbar: { flex: 1, height: 10, borderRadius: 999, backgroundColor: colors.cream, overflow: 'hidden' },
  cmpfill: { height: '100%', borderRadius: 999, backgroundColor: colors.line2 },
  cmpv: { width: 56, textAlign: 'right' },
  cmpNote: { marginTop: 12, lineHeight: 18 },

  hlCard: { paddingVertical: 6, paddingHorizontal: 16 },
  hlrow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  hlrowLast: { borderBottomWidth: 0 },
  hlic: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  catdot: { width: 6, height: 6, borderRadius: 3 },

  atgrid: { flexDirection: 'row', gap: 10 },
  atcard: {
    flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 15,
    paddingVertical: 13, paddingHorizontal: 8, alignItems: 'center', ...shadow.sm,
  },
  atic: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
  atl: { marginTop: 1, textAlign: 'center' },

  nextWhy: { marginTop: 5, lineHeight: 18 },
  adjustBtn: {
    marginTop: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white,
    borderWidth: 1.5, borderColor: colors.line2, borderRadius: radius.md, paddingVertical: 12,
  },
  sectionNote: { marginTop: 12, textAlign: 'center', lineHeight: 18, paddingHorizontal: 20 },
});
