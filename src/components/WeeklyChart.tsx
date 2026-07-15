import React from 'react';
import { View } from 'react-native';
import type { DayActivity } from '@/db/repo';
import { formatDuration } from '@/lib/date';
import { radius, spacing, useTheme } from '@/theme';
import { Body, Muted } from './ui';

/** Simple 7-day focus bar chart (on-device SQLite aggregate). */
export function WeeklyChart({ data }: { data: DayActivity[] }) {
  const { colors } = useTheme();
  const max = Math.max(1, ...data.map((d) => d.seconds));
  const total = data.reduce((s, d) => s + d.seconds, 0);

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Body style={{ fontWeight: '600' }}>This week</Body>
        <Muted>{formatDuration(total)} focused</Muted>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 104, gap: 6 }}>
        {data.map((d, i) => {
          const h = Math.max(4, Math.round((d.seconds / max) * 84));
          const isToday = i === data.length - 1;
          return (
            <View key={d.date} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
              <View
                style={{
                  width: '68%',
                  height: h,
                  backgroundColor: d.seconds > 0 ? (isToday ? colors.accent : colors.primary) : colors.cardAlt,
                  borderRadius: radius.sm,
                }}
              />
              <Muted style={{ fontSize: 11, color: isToday ? colors.accent : colors.textMuted, fontWeight: isToday ? '700' : '400' }}>
                {d.label}
              </Muted>
            </View>
          );
        })}
      </View>
    </View>
  );
}
