import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, radius, catColors, shadow } from '../theme/tokens';
import { Txt } from './ui';
import { Icon } from './Icon';
import { Quest } from '../domain/types';
import { fmt, isDone } from '../domain/mechanics';

export function QuestRow({
  quest,
  startHere,
  onStart,
}: {
  quest: Quest;
  startHere?: boolean;
  onStart: (id: number) => void;
}) {
  const done = isDone(quest);
  const pct = Math.min(100, Math.round((quest.done / quest.est) * 100));
  const circ = 2 * Math.PI * 20;
  const off = circ * (1 - pct / 100);

  return (
    <Pressable
      style={styles.quest}
      onPress={() => (done ? undefined : onStart(quest.id))}
    >
      <View style={styles.ring}>
        <Svg width={46} height={46}>
          {done ? (
            <Circle cx={23} cy={23} r={20} fill={colors.good} />
          ) : (
            <>
              <Circle cx={23} cy={23} r={20} fill="none" stroke="#EFE7D6" strokeWidth={4} />
              <Circle
                cx={23}
                cy={23}
                r={20}
                fill="none"
                stroke={colors.teal}
                strokeWidth={4}
                strokeLinecap="round"
                strokeDasharray={`${circ}`}
                strokeDashoffset={off}
                transform="rotate(-90 23 23)"
              />
            </>
          )}
        </Svg>
        <View style={styles.pct}>
          {done ? <Icon name="check" size={22} color="#fff" /> : <Txt weight={700} size={11} color={colors.tealInk}>{pct}%</Txt>}
        </View>
      </View>

      <View style={styles.main}>
        <Txt weight={700} size={14.5} color={done ? colors.muted : colors.tealInk} numberOfLines={1}>
          {quest.name}
        </Txt>
        <View style={styles.sub}>
          <View style={styles.tag}>
            <View style={[styles.catdot, { backgroundColor: catColors[quest.tag] }]} />
            <Txt weight={700} size={11} color="#5C6B72">{quest.tag}</Txt>
          </View>
          <View style={styles.metaItem}>
            <Icon name="clock" size={13} color="#9A968A" />
            <Txt weight={600} size={12} color={colors.muted}>{fmt(quest.est)}</Txt>
          </View>
          {quest.repeat ? (
            <View style={styles.metaItem}>
              <Icon name="repeat" size={13} color="#9A968A" />
              <Txt weight={600} size={12} color={colors.muted}>Daily</Txt>
            </View>
          ) : quest.due ? (
            <View style={styles.metaItem}>
              <Icon name="calendar" size={13} color="#9A968A" />
              <Txt weight={600} size={12} color={colors.muted}>{quest.due}</Txt>
            </View>
          ) : null}
        </View>
      </View>

      {!done && (
        <Pressable style={styles.go} onPress={() => onStart(quest.id)}>
          <Icon name="play" size={18} color="#fff" />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  quest: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff',
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 12, marginBottom: 10,
    ...shadow.sm,
  },
  ring: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  pct: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' } as any,
  main: { flex: 1, minWidth: 0 },
  sub: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5, flexWrap: 'wrap' },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 3, paddingHorizontal: 9,
    borderRadius: radius.pill, backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.line2,
  },
  catdot: { width: 6, height: 6, borderRadius: 3 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  go: {
    width: 40, height: 40, borderRadius: 13, backgroundColor: colors.teal,
    alignItems: 'center', justifyContent: 'center',
  },
});
