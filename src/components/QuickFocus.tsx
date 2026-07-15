import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import * as repo from '@/db/repo';
import { useGame } from '@/state/stores';
import { Body, Card } from '@/components/ui';
import { tapMedium } from '@/lib/haptics';
import { radius, spacing, useTheme } from '@/theme';

const PRESETS = [15, 25, 45] as const; // minutes

/** One-tap "Focus now": start a Focus Session without pre-creating a quest. */
export function QuickFocus() {
  const { colors } = useTheme();
  const refresh = useGame((s) => s.refresh);

  function startFocus(minutes: number) {
    tapMedium();
    const id = repo.createQuickFocusTask(minutes);
    refresh();
    router.push({ pathname: '/focus/[taskId]', params: { taskId: String(id) } });
  }

  return (
    <Card style={{ gap: spacing.sm }}>
      <Body style={{ fontWeight: '700', fontSize: 18 }}>Start a Focus Session ⏱️</Body>
      <Body style={{ color: colors.textMuted }}>Pick a length — your companion focuses with you.</Body>
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: 2 }}>
        {PRESETS.map((m) => (
          <Pressable
            key={m}
            onPress={() => startFocus(m)}
            style={({ pressed }) => ({
              flex: 1,
              backgroundColor: colors.primary,
              borderRadius: radius.md,
              paddingVertical: spacing.md,
              alignItems: 'center',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Body style={{ color: colors.onPrimary, fontWeight: '800', fontSize: 20 }}>{m}</Body>
            <Body style={{ color: colors.onPrimary, fontSize: 12, opacity: 0.85 }}>min</Body>
          </Pressable>
        ))}
      </View>
    </Card>
  );
}
