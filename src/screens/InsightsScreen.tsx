import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Svg, { Circle, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors, radius, shadow, catColors } from '../theme/tokens';
import { Txt, Card, Btn } from '../components/ui';
import { Icon } from '../components/Icon';
import { OverlayScreen } from '../components/OverlayScreen';
import { useStore } from '../store/store';
import { fmt, money } from '../domain/mechanics';
import { ACHIEVEMENTS } from '../domain/catalogs';

type Range = 'week' | 'month' | 'year';

const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const HOUR_LABELS = ['6a', '9a', '12p', '3p', '6p', '9p', '12a', '3a'];

interface Bar { v: number; lbl: string; }

export function InsightsScreen() {
  const s = useStore((st) => st.state)!;
  const closeOverlay = useStore((st) => st.closeOverlay);
  const openOverlay = useStore((st) => st.openOverlay);
  const showToast = useStore((st) => st.showToast);

  const [range, setRange] = useState<Range>('week');

  const ins = s.insights;
  const total = ins.weekly.reduce((a, b) => a + b, 0);
  const rangeTotal =
    range === 'year' ? ins.yearly.reduce((a, b) => a + b, 0)
    : range === 'month' ? ins.monthly.reduce((a, b) => a + b, 0)
    : total;
  const avg = ins.avgLen;
  const trend = Math.round((total - ins.lastWeekTotal) / Math.max(1, ins.lastWeekTotal) * 100);

  const primary = primaryData(range, ins);
  const pmax = Math.max(...primary.items.map((x) => x.v), 1);
  const pbest = primary.items.findIndex((x) => x.v === pmax);

  const hMax = Math.max(...ins.hours, 1);
  const hbest = ins.hours.indexOf(hMax);
  const hourBars: Bar[] = ins.hours.map((v, i) => ({ v, lbl: HOUR_LABELS[i] }));

  const distItems: Bar[] = ins.dist.map(([n, c]) => ({ v: c, lbl: n }));

  const cr = ins.completionRate;
  const goalPctM = Math.round(ins.goalHitDays / ins.goalTotalDays * 100);
  const crC = 2 * Math.PI * 34;

  const rangeStatLbl =
    range === 'week' ? 'This week' : range === 'month' ? 'This month' : 'This year';

  return (
    <OverlayScreen title="Focus insights">
      {/* range selector */}
      <View style={styles.rangebar}>
        {(['week', 'month', 'year'] as Range[]).map((k) => {
          const on = range === k;
          return (
            <Pressable key={k} onPress={() => setRange(k)} style={[styles.rangeBtn, on && styles.rangeBtnOn]}>
              <Txt weight={800} size={12.5} color={on ? colors.tealInk : colors.muted}>
                {k === 'week' ? 'Week' : k === 'month' ? 'Month' : 'Year'}
              </Txt>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.rangecap}>
        <Icon name="calendar" size={13} color={colors.muted} />
        <Txt weight={700} size={11.5} color={colors.muted}>{rangeLabel(range)}</Txt>
      </View>

      {/* headline stats */}
      <View style={styles.istats}>
        <View style={styles.istat}>
          <Txt weight={800} size={17} color={colors.tealInk}>{fmt(rangeTotal * 60)}</Txt>
          <Txt weight={600} size={11} color={colors.muted} style={{ marginTop: 2 }}>{rangeStatLbl}</Txt>
          {trend !== 0 && (
            <Txt weight={800} size={10} color={trend > 0 ? colors.good : colors.danger} style={{ marginTop: 3 }}>
              {trend > 0 ? '+' : ''}{trend}% vs prev
            </Txt>
          )}
        </View>
        <View style={styles.istat}>
          <Txt weight={800} size={17} color={colors.tealInk}>{ins.sessions}</Txt>
          <Txt weight={600} size={11} color={colors.muted} style={{ marginTop: 2 }}>Sessions</Txt>
        </View>
        <View style={styles.istat}>
          <Txt weight={800} size={17} color={colors.tealInk}>{avg}m</Txt>
          <Txt weight={600} size={11} color={colors.muted} style={{ marginTop: 2 }}>Avg session</Txt>
        </View>
      </View>

      {/* primary bar chart */}
      <View style={styles.shead}>
        <Txt weight={700} size={16} color={colors.tealInk}>{primary.title}</Txt>
        <Txt weight={700} size={11} color={colors.muted}>tap a bar</Txt>
      </View>
      <Card style={{ paddingTop: 18, paddingBottom: 12, paddingHorizontal: 14 }}>
        <VBars items={primary.items} best={pbest} max={pmax} tall />
      </Card>

      {/* The deep dashboard is a Premium payoff; free users see a preview then this gate. */}
      {s.profile.premium ? (
      <>
      {/* 8-week trend */}
      <View style={styles.shead}>
        <Txt weight={700} size={16} color={colors.tealInk}>8-week trend</Txt>
        <Txt weight={700} size={11} color={colors.muted}>trend</Txt>
      </View>
      <Card style={{ paddingTop: 14, paddingBottom: 10, paddingHorizontal: 14 }}>
        <AreaChart vals={ins.trend} />
        <Txt weight={600} size={12} color={colors.muted} style={{ textAlign: 'center', marginTop: 6 }}>
          Trending {trend >= 0 ? 'up' : 'down'} over the last two months.
        </Txt>
      </Card>

      {/* best time of day */}
      <View style={styles.shead}>
        <Txt weight={700} size={16} color={colors.tealInk}>Best time of day</Txt>
      </View>
      <Card style={{ paddingTop: 18, paddingBottom: 12, paddingHorizontal: 14 }}>
        <VBars items={hourBars} best={hbest} max={hMax} />
        <Txt weight={600} size={12} color={colors.muted} style={{ textAlign: 'center', marginTop: 8 }}>
          You focus best around {HOUR_LABELS[hbest]}.
        </Txt>
      </Card>

      {/* category mix */}
      <View style={styles.shead}>
        <Txt weight={700} size={16} color={colors.tealInk}>Where your time goes</Txt>
      </View>
      <Card style={{ paddingVertical: 14, paddingHorizontal: 16 }}>
        {ins.categories.map(([n, p]) => (
          <View key={n} style={styles.icat}>
            <View style={[styles.catdot, { backgroundColor: catColors[n] || colors.teal }]} />
            <Txt weight={700} size={12.5} color={colors.tealInk} style={styles.icatn}>{n}</Txt>
            <View style={styles.icatbar}>
              <View style={[styles.icatbarFill, { width: `${p}%` }]} />
            </View>
            <Txt weight={700} size={12} color={colors.muted} style={styles.icatp}>{p}%</Txt>
          </View>
        ))}
      </Card>

      {/* session length */}
      <View style={styles.shead}>
        <Txt weight={700} size={16} color={colors.tealInk}>Session length</Txt>
        <Txt weight={700} size={11} color={colors.muted}>sessions</Txt>
      </View>
      <Card style={{ paddingTop: 18, paddingBottom: 12, paddingHorizontal: 14 }}>
        <VBars items={distItems} best={-1} max={Math.max(...distItems.map((x) => x.v), 1)} />
      </Card>

      {/* consistency */}
      <View style={styles.shead}>
        <Txt weight={700} size={16} color={colors.tealInk}>Consistency</Txt>
      </View>
      <View style={styles.pairGrid}>
        <Card style={styles.ringCard}>
          <Ring pct={cr} color={colors.good} label={`${cr}%`} circ={crC} />
          <View style={{ flex: 1 }}>
            <Txt weight={800} size={14} color={colors.tealInk}>Completion</Txt>
            <Txt weight={600} size={11.5} color={colors.muted}>of quests started</Txt>
          </View>
        </Card>
        <Card style={styles.ringCard}>
          <Ring pct={goalPctM} color={colors.orange} label={`${ins.goalHitDays}`} circ={crC} />
          <View style={{ flex: 1 }}>
            <Txt weight={800} size={14} color={colors.tealInk}>Goal days</Txt>
            <Txt weight={600} size={11.5} color={colors.muted}>hit {ins.goalHitDays} of {ins.goalTotalDays}</Txt>
          </View>
        </Card>
      </View>

      {/* all-time */}
      <View style={styles.shead}>
        <Txt weight={700} size={16} color={colors.tealInk}>All time</Txt>
      </View>
      <View style={styles.atgrid}>
        <AtCard icon="bolt" v={`${s.lifetime.sessions}`} l="Sessions" />
        <AtCard icon="clock" v={fmt(s.lifetime.minutes * 60)} l="Focused" />
        <AtCard icon="target" v={`${ins.longest}m`} l="Longest" />
        <AtCard icon="sparkle" v={money(ins.coinsLifetime)} l="Coins earned" />
        <AtCard icon="trophy" v={`${s.achievements.length}/${ACHIEVEMENTS.length}`} l="Badges" />
        <AtCard icon="flame" v={`${ins.bestStreak}`} l="Best streak" />
      </View>

      <Btn
        title="Export report (CSV)"
        variant="ghost"
        block
        left={<Icon name="download" size={16} color={colors.teal} />}
        onPress={() => showToast('Focus report exported (demo)')}
        style={{ marginTop: 18 }}
      />
      </>
      ) : (
        <Card style={styles.upsell} onPress={() => openOverlay('premium')}>
          <View style={styles.upsellBadge}><Icon name="crown" size={22} color={colors.orange} /></View>
          <View style={{ flex: 1 }}>
            <Txt weight={800} size={14} color={colors.tealInk}>Unlock your full dashboard</Txt>
            <Txt weight={600} size={11.5} color={colors.muted} style={{ marginTop: 2, lineHeight: 16 }}>
              The 8-week trend, best hours, category mix, session lengths, consistency and all-time totals are Premium.
            </Txt>
          </View>
          <Icon name="chevR" size={16} color={colors.muted} />
        </Card>
      )}

      <Txt weight={600} size={11.5} color={colors.muted} style={styles.note}>
        Data updates as you focus and stays on your device. Range shown: {rangeLabel(range)}.
      </Txt>
    </OverlayScreen>
  );
}

function primaryData(range: Range, ins: { weekly: number[]; monthly: number[]; yearly: number[] }): { items: Bar[]; title: string } {
  if (range === 'week') {
    const lbls = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    return { items: ins.weekly.map((v, i) => ({ v, lbl: lbls[i] })), title: 'Focus this week' };
  }
  if (range === 'month') {
    return { items: ins.monthly.map((v, i) => ({ v, lbl: 'W' + (i + 1) })), title: 'Focus this month' };
  }
  const yl = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  return { items: ins.yearly.map((v, i) => ({ v, lbl: yl[i] })), title: 'Focus this year' };
}

function rangeLabel(range: Range): string {
  const now = new Date();
  if (range === 'week') {
    const end = new Date(now);
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    return `${MO[start.getMonth()]} ${start.getDate()} - ${MO[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
  }
  if (range === 'month') return `${MO[now.getMonth()]} ${now.getFullYear()}`;
  return `${now.getFullYear()}`;
}

function VBars({ items, best, max, tall }: { items: Bar[]; best: number; max: number; tall?: boolean }) {
  return (
    <View style={[styles.ibars, tall && styles.ibarsTall]}>
      {items.map((it, i) => (
        <View key={i} style={styles.ibarcol}>
          <View
            style={[
              styles.ibar,
              { height: `${Math.max(6, Math.round((it.v / max) * 100))}%` },
              i === best && styles.ibarBest,
            ]}
          />
          <Txt weight={700} size={11} color={colors.muted}>{it.lbl}</Txt>
        </View>
      ))}
    </View>
  );
}

function AreaChart({ vals }: { vals: number[] }) {
  const w = 300, h = 94, pad = 8;
  const max = Math.max(...vals, 1);
  const step = (w - pad * 2) / (vals.length - 1);
  const pts = vals.map((v, i) => [pad + i * step, h - pad - (v / max) * (h - pad * 2 - 6)]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = `M${pad} ${h - pad} ` + pts.map((p) => 'L' + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ') + ` L${w - pad} ${h - pad} Z`;
  return (
    <Svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h}>
      <Defs>
        <LinearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="rgba(12,76,96,0.26)" />
          <Stop offset="1" stopColor="rgba(12,76,96,0)" />
        </LinearGradient>
      </Defs>
      <Path d={area} fill="url(#tg)" />
      <Path d={line} fill="none" stroke={colors.teal} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <Circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 4 : 2.5} fill={i === pts.length - 1 ? colors.orange : colors.teal} />
      ))}
    </Svg>
  );
}

function Ring({ pct, color, label, circ }: { pct: number; color: string; label: string; circ: number }) {
  return (
    <View style={styles.ring}>
      <Svg width={66} height={66} viewBox="0 0 82 82">
        <Circle cx={41} cy={41} r={34} fill="none" stroke="#EFE7D6" strokeWidth={8} />
        <Circle
          cx={41} cy={41} r={34} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round"
          strokeDasharray={`${circ}`} strokeDashoffset={circ * (1 - pct / 100)} transform="rotate(-90 41 41)"
        />
      </Svg>
      <View style={styles.ringCtr}>
        <Txt weight={800} size={15} color={colors.tealInk}>{label}</Txt>
      </View>
    </View>
  );
}

function AtCard({ icon, v, l }: { icon: string; v: string; l: string }) {
  return (
    <View style={styles.atcard}>
      <View style={styles.atic}><Icon name={icon as any} size={18} color={colors.teal} /></View>
      <Txt weight={800} size={16} color={colors.tealInk}>{v}</Txt>
      <Txt weight={600} size={10.5} color={colors.muted} style={{ marginTop: 1 }}>{l}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  rangebar: { flexDirection: 'row', gap: 6, backgroundColor: '#EFE7D6', padding: 4, borderRadius: 14, marginBottom: 8 },
  rangeBtn: { flex: 1, paddingVertical: 8, paddingHorizontal: 4, borderRadius: 10, alignItems: 'center' },
  rangeBtnOn: { backgroundColor: '#fff', ...shadow.sm },
  rangecap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 14 },
  istats: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  istat: {
    flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center', ...shadow.sm,
  },
  shead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 12, marginHorizontal: 2 },
  ibars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, height: 120 },
  ibarsTall: { height: 150 },
  ibarcol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 7 },
  ibar: { width: '100%', maxWidth: 26, backgroundColor: colors.teal2, borderTopLeftRadius: 7, borderTopRightRadius: 7, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
  ibarBest: { backgroundColor: colors.orange },
  icat: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 8 },
  catdot: { width: 6, height: 6, borderRadius: 3 },
  icatn: { width: 64 },
  icatbar: { flex: 1, height: 8, borderRadius: 999, backgroundColor: colors.cream, overflow: 'hidden' },
  icatbarFill: { height: '100%', borderRadius: 999, backgroundColor: colors.teal },
  icatp: { width: 34, textAlign: 'right' },
  pairGrid: { flexDirection: 'row', gap: 12 },
  ringCard: { flex: 1, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  ring: { width: 66, height: 66 },
  ringCtr: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  atgrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  atcard: {
    width: '31.5%', flexGrow: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    borderRadius: 15, paddingVertical: 13, paddingHorizontal: 8, alignItems: 'center', ...shadow.sm,
  },
  atic: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
  upsell: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginTop: 16,
  },
  upsellBadge: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF4E7', borderWidth: 1, borderColor: '#F6DFC4', alignItems: 'center', justifyContent: 'center' },
  note: { textAlign: 'center', marginTop: 10, lineHeight: 17, paddingHorizontal: 10 },
});
