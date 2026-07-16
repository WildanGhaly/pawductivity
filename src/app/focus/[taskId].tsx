import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as repo from '@/db/repo';
import { selectActivePet, useGame } from '@/state/stores';
import { showAlert } from '@/lib/alert';
import { notifySuccess, tapLight, tapMedium } from '@/lib/haptics';
import { Keys, storage } from '@/state/mmkv';
import { Body, Button, Heading, Muted, Screen } from '@/components/ui';
import { CompanionView } from '@/components/CompanionView';
import { BackIcon, PauseIcon, PlayIcon } from '@/components/icons';
import { MeadowBackground } from '@/components/MeadowBackground';
import type { CompletionReward, Task } from '@/db/types';
import { font, radius, spacing, useTheme } from '@/theme';

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
  const pauseFocus = useGame((s) => s.pauseFocus);
  const pet = useGame(selectActivePet);
  const equippedClothes = useGame((s) => s.equippedClothes);

  const [task, setTask] = useState<Task | null>(() => repo.getTask(id));
  const [baseSeconds, setBaseSeconds] = useState(() => repo.getTask(id)?.time_completed ?? 0);
  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [, setTick] = useState(0);
  const [reward, setReward] = useState<CompletionReward | null>(null);
  const finishing = useRef(false);

  // Mirrors of live state for the unmount cleanup (which captures its closure once).
  const runningRef = useRef(running);
  const startedAtRef = useRef(startedAt);
  const baseRef = useRef(baseSeconds);
  useEffect(() => {
    runningRef.current = running;
  }, [running]);
  useEffect(() => {
    startedAtRef.current = startedAt;
  }, [startedAt]);
  useEffect(() => {
    baseRef.current = baseSeconds;
  }, [baseSeconds]);

  // Leaving the screen (incl. Android hardware-back / swipe-back, which bypass the in-app
  // "‹ Back" handler) pauses the session: flush real focused time and clear the MMKV bookmark.
  useEffect(() => {
    return () => {
      if (runningRef.current && startedAtRef.current && !finishing.current) {
        const done = baseRef.current + (Date.now() - startedAtRef.current) / 1000;
        useGame.getState().pauseFocus(id, done);
        storage.remove(Keys.timerActive);
      }
    };
  }, [id]);

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

  // Gentle "breathing" pulse of the ring while focusing.
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!running) {
      pulse.stopAnimation();
      Animated.timing(pulse, { toValue: 1, duration: 250, useNativeDriver: true }).start();
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.035, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [running, pulse]);

  // Auto-finish when the countdown reaches zero.
  useEffect(() => {
    if (!running || !startedAt || !task || task.completed || finishing.current) return;
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
    tapMedium();
    const at = Date.now();
    setStartedAt(at);
    setRunning(true);
    persistActive(at);
  }

  function flush(): number {
    const done = baseSeconds + (running && startedAt ? (Date.now() - startedAt) / 1000 : 0);
    pauseFocus(id, done); // persist + refresh the store so Home stats update after a pause
    const capped = Math.min(task!.estimated_time, done);
    setBaseSeconds(capped);
    return capped;
  }

  function pause() {
    tapLight();
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
      notifySuccess();
      setRunning(false);
      setStartedAt(null);
      setReward(r); // in-screen celebration (works on every platform — no Alert dependency)
    } catch (e: any) {
      setRunning(false);
      setStartedAt(null);
      persistActive(null);
      finishing.current = false;
      showAlert('Oops', e?.message ?? 'Could not complete');
    }
  }

  const dark = '#2D2F41'; // legacy timer text colour
  const circleShadow = {
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  } as const;

  return (
    <Screen scroll={false} edges={['top', 'bottom']} background={<MeadowBackground />}>
      {/* back button (white circle, legacy) */}
      <View style={{ flexDirection: 'row' }}>
        <Pressable
          onPress={() => (running ? pause() : router.back())}
          hitSlop={12}
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...circleShadow }}
        >
          <BackIcon size={18} />
        </Pressable>
      </View>

      {/* task name */}
      <View style={{ alignItems: 'center', gap: 2, marginTop: spacing.xs }}>
        <Heading style={{ textAlign: 'center', color: dark }}>{task.name}</Heading>
        {task.tag ? <Muted>{task.tag}</Muted> : null}
      </View>

      {/* big countdown text */}
      <View style={{ alignItems: 'center', gap: 2, marginTop: spacing.md }}>
        <Text style={{ fontSize: 60, fontFamily: font.family.bold, color: dark, fontVariant: ['tabular-nums'] }}>{mmss(remaining)}</Text>
        <Muted>
          {mmss(totalDone)} / {mmss(task.estimated_time)} focused
        </Muted>
      </View>

      {/* big pet standing on the meadow */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: spacing.lg }}>
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          {pet ? <CompanionView species={pet.species} clothesId={equippedClothes[0]?.id} health={pet.health} size={210} /> : null}
        </Animated.View>
      </View>

      {/* round play/pause + finish */}
      <View style={{ alignItems: 'center', gap: spacing.sm }}>
        <Pressable
          onPress={running ? pause : start}
          style={({ pressed }) => ({
            width: 78,
            height: 78,
            borderRadius: 39,
            backgroundColor: running ? colors.accent : colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.85 : 1,
            ...circleShadow,
          })}
        >
          {running ? <PauseIcon size={30} /> : <PlayIcon size={30} />}
        </Pressable>
        <Button label="Finish & claim reward" variant="ghost" onPress={finish} />
      </View>

      {reward ? <Celebration reward={reward} petName={pet?.name} onDone={() => router.back()} /> : null}
    </Screen>
  );
}

/** Full-screen success overlay shown when a Focus Session completes. */
function Celebration({ reward, petName, onDone }: { reward: CompletionReward; petName?: string; onDone: () => void }) {
  const { colors } = useTheme();
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(pop, { toValue: 1, useNativeDriver: true, friction: 6, tension: 80 }).start();
  }, [pop]);

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
      <Animated.View
        style={{
          width: '100%',
          maxWidth: 360,
          backgroundColor: colors.card,
          borderRadius: 24,
          padding: spacing.xl,
          alignItems: 'center',
          gap: spacing.sm,
          transform: [{ scale: pop }],
        }}
      >
        <Body style={{ fontSize: 44 }}>🎉</Body>
        <Heading style={{ textAlign: 'center' }}>Focus complete!</Heading>
        <Muted style={{ textAlign: 'center' }}>
          Great work{petName ? ` — ${petName} is proud of you` : ''}.
        </Muted>
        <View style={{ flexDirection: 'row', gap: spacing.lg, marginVertical: spacing.sm }}>
          <View style={{ alignItems: 'center' }}>
            <Body style={{ fontSize: 22, fontWeight: '800', color: colors.coin }}>+{reward.coinsEarned}</Body>
            <Muted>coins</Muted>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Body style={{ fontSize: 22, fontWeight: '800', color: colors.primary }}>+{reward.xpEarned}</Body>
            <Muted>XP</Muted>
          </View>
        </View>
        {reward.leveledUp ? (
          <Body style={{ fontWeight: '700', color: colors.accent, textAlign: 'center' }}>
            🎊 Level {reward.newLevel}!  +{reward.levelUpBonusCoins} bonus coins
          </Body>
        ) : null}
        <Button label="Done" onPress={onDone} style={{ alignSelf: 'stretch', marginTop: spacing.sm }} />
      </Animated.View>
    </View>
  );
}
