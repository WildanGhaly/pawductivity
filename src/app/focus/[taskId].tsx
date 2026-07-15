import React, { useEffect, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as repo from '@/db/repo';
import { selectActivePet, useGame } from '@/state/stores';
import { Keys, storage } from '@/state/mmkv';
import { Body, Button, Card, Heading, Muted, Screen } from '@/components/ui';
import { CompanionView } from '@/components/CompanionView';
import type { Task } from '@/db/types';
import { font, spacing, useTheme } from '@/theme';

function mmss(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

export default function FocusSession() {
  const { colors } = useTheme();
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const id = Number(taskId);
  const completeQuest = useGame((s) => s.completeQuest);
  const pet = useGame(selectActivePet);

  const [task, setTask] = useState<Task | null>(() => repo.getTask(id));
  const [baseSeconds, setBaseSeconds] = useState(() => repo.getTask(id)?.time_completed ?? 0);
  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [, setTick] = useState(0);
  const finishing = useRef(false);

  // Resume a still-running session (e.g. after app was backgrounded/killed).
  useEffect(() => {
    const raw = storage.getString(Keys.timerActive);
    if (raw) {
      try {
        const a = JSON.parse(raw) as { taskId: number; startedAt: number };
        if (a.taskId === id && a.startedAt) {
          setStartedAt(a.startedAt);
          setRunning(true);
        }
      } catch {}
    }
  }, [id]);

  // 1s display tick while running.
  useEffect(() => {
    if (!running) return;
    const h = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(h);
  }, [running]);

  // Auto-finish when the countdown reaches zero.
  useEffect(() => {
    if (!running || !startedAt || !task || finishing.current) return;
    const done = baseSeconds + (Date.now() - startedAt) / 1000;
    if (done >= task.estimated_time) finish();
  });

  if (!task) {
    return (
      <Screen scroll={false}>
        <Muted>Quest not found.</Muted>
        <Button label="Back" variant="ghost" onPress={() => router.back()} />
      </Screen>
    );
  }

  const elapsed = running && startedAt ? (Date.now() - startedAt) / 1000 : 0;
  const totalDone = baseSeconds + elapsed;
  const remaining = Math.max(0, task.estimated_time - totalDone);
  const progress = task.estimated_time > 0 ? Math.min(1, totalDone / task.estimated_time) : 0;

  function persistActive(at: number | null) {
    if (at) storage.set(Keys.timerActive, JSON.stringify({ taskId: id, startedAt: at }));
    else storage.remove(Keys.timerActive);
  }

  function start() {
    const at = Date.now();
    setStartedAt(at);
    setRunning(true);
    persistActive(at);
  }

  function flush(): number {
    const done = baseSeconds + (running && startedAt ? (Date.now() - startedAt) / 1000 : 0);
    repo.setFocusProgress(id, done);
    const capped = Math.min(task!.estimated_time, done);
    setBaseSeconds(capped);
    return capped;
  }

  function pause() {
    flush();
    setRunning(false);
    setStartedAt(null);
    persistActive(null);
  }

  function finish() {
    if (finishing.current) return;
    finishing.current = true;
    persistActive(null);
    try {
      const r = completeQuest(id);
      let msg = `+${r.coinsEarned} 🪙   +${r.xpEarned} XP`;
      if (r.leveledUp) msg += `\n\n🎉 Level ${r.newLevel}!  +${r.levelUpBonusCoins} 🪙 bonus`;
      Alert.alert('Focus session complete!', msg, [{ text: 'Nice', onPress: () => router.back() }]);
    } catch (e: any) {
      finishing.current = false;
      Alert.alert('Oops', e?.message ?? 'Could not complete');
    }
  }

  return (
    <Screen scroll={false} edges={['top', 'bottom']}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button label="‹ Back" variant="ghost" onPress={() => (running ? pause() : router.back())} style={{ paddingHorizontal: spacing.md }} />
        <Muted>Focus Session</Muted>
        <View style={{ width: 64 }} />
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg }}>
        {pet ? <CompanionView species={pet.species} stage={pet.evolution_stage} health={pet.health} size={160} /> : null}
        <Heading style={{ textAlign: 'center' }}>{task.name}</Heading>
        {task.tag ? <Muted>{task.tag}</Muted> : null}

        <Body style={{ fontSize: 64, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] }}>
          {mmss(remaining)}
        </Body>

        <View style={{ width: '80%', height: 10, borderRadius: 999, backgroundColor: colors.cardAlt, overflow: 'hidden' }}>
          <View style={{ width: `${progress * 100}%`, height: '100%', backgroundColor: colors.primary }} />
        </View>
        <Muted>
          {mmss(totalDone)} / {mmss(task.estimated_time)} focused
        </Muted>
      </View>

      <View style={{ gap: spacing.sm }}>
        {running ? (
          <Button label="Pause" variant="accent" onPress={pause} />
        ) : (
          <Button label={baseSeconds > 0 ? 'Resume' : 'Start focusing'} onPress={start} />
        )}
        <Button label="Finish & claim reward" variant="ghost" onPress={finish} />
      </View>
    </Screen>
  );
}
