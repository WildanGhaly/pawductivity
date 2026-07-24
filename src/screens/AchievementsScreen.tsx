import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, radius, shadow } from '../theme/tokens';
import { Txt, Card } from '../components/ui';
import { Icon, IconName } from '../components/Icon';
import { OverlayScreen } from '../components/OverlayScreen';
import { useStore } from '../store/store';
import { ACHIEVEMENTS, Achievement } from '../domain/catalogs';
import { achProgress, money } from '../domain/mechanics';
import { foodImg } from '../assets/registry';
import { AppState } from '../domain/types';

interface Group { name: string; items: Achievement[]; }

export function AchievementsScreen() {
  const s = useStore((st) => st.state)!;
  const un = s.achievements;

  // group achievements by their .group, preserving first-seen order
  const groups: Group[] = [];
  ACHIEVEMENTS.forEach((a) => {
    let g = groups.find((x) => x.name === a.group);
    if (!g) { g = { name: a.group, items: [] }; groups.push(g); }
    g.items.push(a);
  });

  const total = ACHIEVEMENTS.length;
  const got = ACHIEVEMENTS.filter((a) => un.includes(a.id)).length;

  const R = 26;
  const C = 2 * Math.PI * R;

  return (
    <OverlayScreen title="Achievements">
      {/* summary ring */}
      <Card style={styles.achtop}>
        <View style={styles.cring}>
          <Svg width={66} height={66} viewBox="0 0 64 64">
            <Circle cx={32} cy={32} r={R} fill="none" stroke="#EFE7D6" strokeWidth={7} />
            <Circle
              cx={32} cy={32} r={R} fill="none" stroke={colors.orange} strokeWidth={7}
              strokeLinecap="round" strokeDasharray={`${C}`} strokeDashoffset={C * (1 - got / total)}
              transform="rotate(-90 32 32)"
            />
          </Svg>
          <View style={styles.cringv}>
            <Txt weight={800} size={15} color={colors.tealInk}>{got}</Txt>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Txt weight={800} size={17} color={colors.tealInk}>{got} of {total} badges</Txt>
          <Txt weight={600} size={12} color={colors.muted} style={{ marginTop: 2 }}>Keep focusing to collect them all.</Txt>
        </View>
      </Card>

      {groups.map((g) => {
        const gg = g.items.filter((a) => un.includes(a.id)).length;
        return (
          <View key={g.name}>
            <View style={styles.shead}>
              <Txt weight={700} size={16} color={colors.tealInk}>{g.name}</Txt>
              <Txt weight={700} size={11} color={colors.muted}>{gg}/{g.items.length}</Txt>
            </View>
            <View style={styles.achgrid}>
              {rows(g.items).map((row, ri) => (
                <View key={ri} style={styles.achrow}>
                  {row.map((a) => (
                    <Badge key={a.id} a={a} got={un.includes(a.id)} s={s} />
                  ))}
                  {row.length === 1 && <View style={{ flex: 1 }} />}
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </OverlayScreen>
  );
}

// chunk items into rows of two for the 1fr 1fr grid
function rows<T>(items: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += 2) out.push(items.slice(i, i + 2));
  return out;
}

function Badge({ a, got, s }: { a: Achievement; got: boolean; s: AppState }) {
  const prog = !got ? achProgress(s, a.id) : null;
  let pc = 0, cur = '', goal = '';
  if (prog) {
    pc = Math.min(100, Math.round((prog[0] / prog[1]) * 100));
    cur = prog[0] >= 1000 ? money(prog[0]) : String(prog[0]);
    goal = prog[1] >= 1000 ? money(prog[1]) : String(prog[1]);
  }

  return (
    <View style={[styles.achcard, !got && styles.achcardLocked]}>
      <View style={[styles.achic, !got && styles.achicLocked]}>
        {a.imgFood != null ? (
          <Image source={foodImg[1]} style={{ width: 24, height: 24 }} resizeMode="contain" />
        ) : got ? (
          <Icon name={(a.ic as IconName) || 'sparkle'} size={24} color="#7A4B00" />
        ) : (
          <Icon name="lock" size={24} color={colors.muted} />
        )}
      </View>
      <Txt weight={800} size={13.5} color={colors.tealInk} style={styles.center}>{a.name}</Txt>
      <Txt weight={600} size={11.5} color={colors.muted} style={[styles.center, { marginTop: 3, lineHeight: 16 }]}>{a.desc}</Txt>
      {prog && (
        <>
          <View style={styles.achprog}>
            <View style={[styles.achprogFill, { width: `${pc}%` }]} />
          </View>
          <Txt weight={800} size={10.5} color={colors.muted} style={[styles.center, { marginTop: 5 }]}>{cur} / {goal}</Txt>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  achtop: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, marginBottom: 6 },
  cring: { position: 'relative' },
  cringv: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  shead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, marginBottom: 10, marginHorizontal: 2 },
  achgrid: { gap: 12 },
  achrow: { flexDirection: 'row', gap: 12 },
  achcard: {
    flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    borderRadius: 16, padding: 16, paddingHorizontal: 12, alignItems: 'center', ...shadow.sm,
  },
  achcardLocked: { opacity: 0.7 },
  achic: {
    width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    marginBottom: 9, backgroundColor: colors.yellow,
  },
  achicLocked: { backgroundColor: colors.cream },
  center: { textAlign: 'center' },
  achprog: { height: 6, borderRadius: 999, backgroundColor: '#EFE7D6', overflow: 'hidden', marginTop: 'auto', width: '100%' },
  achprogFill: { height: '100%', borderRadius: 999, backgroundColor: colors.teal2 },
});
