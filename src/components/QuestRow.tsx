import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import type { Task } from '@/db/types';
import { useGame } from '@/state/stores';
import { showAlert } from '@/lib/alert';
import { formatDuration } from '@/lib/date';
import { font, radius, spacing, useTheme } from '@/theme';
import { Body, Muted, Pill } from './ui';

const KIND_EMOJI: Record<string, string> = { target: '🎯', checklist: '☑️', focus: '⏱️' };

export function QuestRow({ task }: { task: Task }) {
  const { colors } = useTheme();
  const complete = useGame((s) => s.completeQuest);
  const remove = useGame((s) => s.removeQuest);

  function done() {
    try {
      const r = complete(task.id);
      let msg = `+${r.coinsEarned} 🪙   +${r.xpEarned} XP`;
      if (r.leveledUp) msg += `\n\n🎉 Level ${r.newLevel}!  +${r.levelUpBonusCoins} 🪙 bonus`;
      showAlert('Quest complete!', msg);
    } catch (e: any) {
      showAlert('Oops', e?.message ?? 'Could not complete');
    }
  }

  function confirmDelete() {
    showAlert('Delete quest?', `“${task.name}”`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove(task.id) },
    ]);
  }

  const due = task.due_date ? new Date(task.due_date) : null;

  return (
    <Pressable onLongPress={confirmDelete} delayLongPress={350}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          backgroundColor: colors.card,
          borderRadius: radius.md,
          padding: spacing.md,
          borderWidth: 0.5,
          borderColor: colors.border,
        }}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <Body style={{ fontWeight: '600' }}>
            {KIND_EMOJI[task.kind] ?? '•'} {task.name}
          </Body>
          <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', alignItems: 'center' }}>
            {task.tag ? <Pill label={task.tag} /> : null}
            <Muted>{formatDuration(task.estimated_time)}</Muted>
            {task.kind === 'target' && task.target_value != null ? (
              <Muted>
                · {task.target_current}/{task.target_value} {task.target_unit ?? ''}
              </Muted>
            ) : null}
            {due ? (
              <Muted>
                · {due.toLocaleDateString(undefined, { weekday: 'short' })}{' '}
                {due.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
              </Muted>
            ) : null}
          </View>
        </View>
        <Pressable
          onPress={() => router.push({ pathname: '/focus/[taskId]', params: { taskId: String(task.id) } })}
          hitSlop={8}
          style={({ pressed }) => ({
            backgroundColor: colors.primary,
            width: 40,
            height: 40,
            borderRadius: radius.pill,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Body style={{ color: colors.onPrimary, fontWeight: '700', fontSize: font.size.md }}>▶</Body>
        </Pressable>
        <Pressable
          onPress={done}
          hitSlop={8}
          style={({ pressed }) => ({
            backgroundColor: colors.success,
            width: 40,
            height: 40,
            borderRadius: radius.pill,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Body style={{ color: '#fff', fontWeight: '700', fontSize: font.size.lg }}>✓</Body>
        </Pressable>
      </View>
    </Pressable>
  );
}
