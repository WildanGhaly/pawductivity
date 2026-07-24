import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { colors, radius, shadow } from '../theme/tokens';
import { Txt } from '../components/ui';
import { Icon } from '../components/Icon';
import { PetView } from '../components/PetView';
import { BottomSheet } from '../components/BottomSheet';
import { useStore } from '../store/store';
import { mmss, fmt, isDone } from '../domain/mechanics';
import { POMO_WORK, POMO_BREAK, SOUNDS } from '../domain/catalogs';
import { playSoundscape, stopSoundscape, getActiveSoundscape } from '../audio/soundscape';

type Mode = 'standard' | 'pomodoro';
type Phase = 'work' | 'break';

const { width: SCRW } = Dimensions.get('window');
const DIAL = Math.min(240, Math.round(SCRW * 0.62));
const PET = Math.min(220, Math.round(SCRW * 0.6));
const RING_R = 112;
const RING_C = 2 * Math.PI * RING_R; // ~703.7 for r=112 (matches proto)
const TEXT_SHADOW = {
  textShadowColor: 'rgba(0,0,0,0.3)',
  textShadowOffset: { width: 0, height: 2 },
  textShadowRadius: 8,
};

export function FocusScreen({ param }: { param?: { questId?: number } }) {
  const insets = useSafeAreaInsets();
  const s = useStore((st) => st.state)!;
  const bankFocus = useStore((st) => st.bankFocus);
  const openOverlay = useStore((st) => st.openOverlay);
  const closeOverlay = useStore((st) => st.closeOverlay);
  const showToast = useStore((st) => st.showToast);

  const pet = s.pet;
  const petName = pet.name;

  // Soundscape: loops a bundled ambient asset for the whole session.
  const [soundOpen, setSoundOpen] = useState(false);
  const [soundId, setSoundId] = useState(() => getActiveSoundscape());
  const pickSound = (id: number, free: boolean, name: string) => {
    if (!free && !s.profile.premium) {
      showToast(`${name} is a Premium soundscape`);
      return;
    }
    setSoundId(id);
    playSoundscape(id);
    setSoundOpen(false);
    showToast(id === 0 ? 'Sound off' : `${name} on`);
  };
  // Always release audio when the Focus screen goes away.
  useEffect(() => () => stopSoundscape(), []);

  // Resolve the quest for this session. If none is found, fall back to a 25:00
  // standard timer named after the first active quest (or "Focus").
  const qid = param?.questId ?? null;
  const active = s.quests.filter((q) => !isDone(q));
  const quest = qid != null ? s.quests.find((q) => q.id === qid) : active[0];
  const bankQid = quest ? quest.id : null;
  const est = quest ? quest.est : 1500;
  const startDone = quest ? quest.done : 0;
  const questName = quest ? quest.name : active[0]?.name ?? 'Focus';
  const tag = quest ? quest.tag : 'Focus';
  // Remaining quest work for this session (seconds). Filling this completes it.
  const sessionTarget = Math.max(1, est - startDone);

  // Timestamp-authoritative timer state kept in a ref so the interval never sees
  // a stale closure. React state mirrors only what the UI renders.
  const tRef = useRef({
    mode: 'standard' as Mode,
    phase: 'work' as Phase,
    phaseLen: sessionTarget,
    remaining: sessionTarget,
    base: sessionTarget,
    startedAt: 0,
    workDone: 0,
    cycle: 1,
    running: false,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [mode, setMode] = useState<Mode>('standard');
  const [phase, setPhase] = useState<Phase>('work');
  const [cycle, setCycle] = useState(1);
  const [remaining, setRemaining] = useState(sessionTarget);
  const [running, setRunning] = useState(false);
  const [stateLabel, setStateLabel] = useState('Tap play to start');
  const [caption, setCaption] = useState(`${petName} is ready to focus with you`);

  const stopInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => () => stopInterval(), []);

  const curRemaining = () => {
    const t = tRef.current;
    if (!t.running) return t.remaining;
    const el = Math.floor((Date.now() - t.startedAt) / 1000);
    return Math.max(0, t.base - el);
  };

  const startWorkBlock = () => {
    const t = tRef.current;
    const left = Math.max(1, sessionTarget - t.workDone);
    t.phase = 'work';
    t.phaseLen = t.mode === 'pomodoro' ? Math.min(POMO_WORK, left) : left;
    t.remaining = t.phaseLen;
    t.base = t.phaseLen;
    setPhase('work');
    setRemaining(t.remaining);
  };

  const startBreak = () => {
    const t = tRef.current;
    t.phase = 'break';
    t.phaseLen = POMO_BREAK;
    t.remaining = POMO_BREAK;
    t.base = POMO_BREAK;
    setPhase('break');
    setRemaining(POMO_BREAK);
  };

  const complete = () => {
    const t = tRef.current;
    t.running = false;
    stopInterval();
    setRunning(false);
    const workedSec = Math.max(0, sessionTarget);
    if (workedSec <= 0) {
      closeOverlay();
      return;
    }
    const r = bankFocus(bankQid, workedSec, t.mode === 'pomodoro');
    openOverlay('reward', { coins: r.coins, bonus: r.bonus, mins: r.mins, questName });
  };

  const onPhaseEnd = () => {
    const t = tRef.current;
    if (t.phase === 'work') {
      t.workDone += t.phaseLen;
      if (t.workDone >= sessionTarget) {
        complete();
        return;
      }
      startBreak();
      t.startedAt = Date.now();
      t.base = t.remaining;
      setStateLabel('Take a breather');
      setCaption(`Break time. ${petName} is resting`);
      showToast('Break time. Stretch a little.');
    } else {
      t.cycle += 1;
      setCycle(t.cycle);
      startWorkBlock();
      t.startedAt = Date.now();
      t.base = t.remaining;
      setStateLabel('Focusing');
      setCaption(`${petName} is focusing with you again`);
      showToast('Back to focus');
    }
  };

  const tick = () => {
    const t = tRef.current;
    if (!t.running) return;
    const rem = curRemaining();
    t.remaining = rem;
    setRemaining(rem);
    if (rem <= 0) onPhaseEnd();
  };

  const startInterval = () => {
    stopInterval();
    intervalRef.current = setInterval(tick, 1000);
  };

  const pause = () => {
    const t = tRef.current;
    if (!t.running) return;
    t.remaining = curRemaining();
    t.running = false;
    stopInterval();
    setRunning(false);
    setRemaining(t.remaining);
    setStateLabel('Paused');
    setCaption(`Paused. ${petName} is waiting for you`);
  };

  const toggleTimer = () => {
    const t = tRef.current;
    if (t.running) {
      pause();
      return;
    }
    t.running = true;
    t.startedAt = Date.now();
    t.base = t.remaining;
    setRunning(true);
    setStateLabel(t.phase === 'break' ? 'Take a breather' : 'Focusing');
    setCaption(
      t.phase === 'break'
        ? `${petName} is resting with you`
        : `${petName} is focusing with you. Stay and it earns energy.`,
    );
    startInterval();
  };

  const resetTimer = () => {
    const t = tRef.current;
    if (t.running) {
      t.running = false;
      stopInterval();
    }
    t.workDone = 0;
    t.cycle = 1;
    setCycle(1);
    startWorkBlock();
    setRunning(false);
    setStateLabel('Tap play to start');
    setCaption(`${petName} is ready to focus with you`);
  };

  const setFxMode = (m: Mode) => {
    const t = tRef.current;
    if (m === t.mode) return;
    if (t.running) {
      t.running = false;
      stopInterval();
      setRunning(false);
    }
    t.mode = m;
    t.cycle = 1;
    setMode(m);
    setCycle(1);
    startWorkBlock();
    setStateLabel('Tap play to start');
  };

  const addFive = () => {
    const t = tRef.current;
    t.remaining += 300;
    t.phaseLen += 300;
    if (t.running) {
      t.base = t.remaining;
      t.startedAt = Date.now();
    }
    setRemaining(t.remaining);
    showToast('Added 5 minutes');
  };

  const previewFinish = () => {
    const t = tRef.current;
    if (t.running) {
      t.running = false;
      stopInterval();
    }
    t.workDone = sessionTarget;
    complete();
  };

  const ringColor = phase === 'break' ? colors.orange : colors.teal;
  const phaseLen = tRef.current.phaseLen || 1;
  const ringOffset = RING_C * (remaining / phaseLen);

  return (
    <LinearGradient colors={['#15718C', '#0C4C60']} style={styles.root}>
      {/* top bar: back, mode toggle, sound */}
      <View style={[styles.top, { paddingTop: Math.max(30, insets.top + 16) }]}>
        <Pressable style={styles.iconbtn} onPress={closeOverlay}>
          <Icon name="chevL" size={18} color={colors.teal} strokeWidth={2.5} />
        </Pressable>
        <View style={styles.mode}>
          <Pressable
            style={[styles.modeBtn, mode === 'standard' && styles.modeBtnOn]}
            onPress={() => setFxMode('standard')}
          >
            <Txt weight={800} size={12.5} color={mode === 'standard' ? colors.white : colors.muted}>
              Timer
            </Txt>
          </Pressable>
          <Pressable
            style={[styles.modeBtn, mode === 'pomodoro' && styles.modeBtnOn]}
            onPress={() => setFxMode('pomodoro')}
          >
            <Txt weight={800} size={12.5} color={mode === 'pomodoro' ? colors.white : colors.muted}>
              Pomodoro
            </Txt>
          </Pressable>
        </View>
        <Pressable style={styles.iconbtn} onPress={() => setSoundOpen(true)} accessibilityLabel="Soundscape">
          <Icon name="sound" size={18} color={soundId ? colors.orange : colors.teal} strokeWidth={2.2} />
        </Pressable>
      </View>

      {/* quest name + target */}
      <View style={styles.qwrap}>
        <Txt weight={800} size={19} color={colors.white} numberOfLines={1} style={[styles.center, TEXT_SHADOW]}>
          {questName}
        </Txt>
        <Txt weight={600} size={13} color={colors.white} style={[styles.center, styles.qtag, TEXT_SHADOW]}>
          {`${fmt(est)} target · ${tag}`}
        </Txt>
      </View>

      {/* main: dial + pet */}
      <View style={styles.main}>
        <View style={[styles.dial, { width: DIAL, height: DIAL }]}>
          <Svg width={DIAL} height={DIAL} viewBox="0 0 250 250">
            <Circle cx={125} cy={125} r={RING_R} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={14} />
            <Circle
              cx={125}
              cy={125}
              r={RING_R}
              fill="none"
              stroke={ringColor}
              strokeWidth={14}
              strokeLinecap="round"
              strokeDasharray={RING_C}
              strokeDashoffset={ringOffset}
              transform="rotate(-90 125 125)"
            />
          </Svg>
          <View style={styles.dialCenter}>
            {mode === 'pomodoro' && (
              <Txt weight={800} size={12} color={colors.white} style={[styles.phaseLbl, TEXT_SHADOW]}>
                {phase === 'work' ? `Focus block ${cycle}` : 'Break'}
              </Txt>
            )}
            <Txt weight={800} size={52} color={colors.white} style={[styles.tnum, TEXT_SHADOW]}>
              {mmss(remaining)}
            </Txt>
            <Txt weight={700} size={12} color={colors.white} style={[styles.tlbl, TEXT_SHADOW]}>
              {stateLabel}
            </Txt>
          </View>
        </View>

        {mode === 'pomodoro' && (
          <View style={styles.pomoNote}>
            <Txt weight={700} size={12} color={colors.white}>
              25 min focus, 5 min break, on repeat
            </Txt>
          </View>
        )}

        <View style={styles.petGround}>
          <View style={styles.petCaption}>
            <Txt weight={700} size={13} color={colors.white} style={styles.center}>
              {caption}
            </Txt>
          </View>
          <View style={[styles.petStage, { width: PET, height: PET }]}>
            <View style={[styles.petShadow, { width: PET * 0.62, height: PET * 0.1, borderRadius: PET * 0.1 }]} />
            <PetView species={pet.species} clothesId={pet.clothesId} size={PET} speed={running ? 1 : 0.7} />
          </View>
        </View>
      </View>

      {/* skip to end */}
      <View style={styles.preview}>
        <Pressable style={styles.previewBtn} onPress={previewFinish}>
          <Icon name="check" size={13} color={colors.white} strokeWidth={2.2} />
          <Txt weight={600} size={12.5} color={colors.white}>
            Skip to end (demo)
          </Txt>
        </Pressable>
      </View>

      {/* controls */}
      <View style={[styles.controls, { paddingBottom: 34 + insets.bottom }]}>
        <RoundCtl label="Reset" onPress={resetTimer}>
          <Icon name="reset" size={22} color={colors.teal} strokeWidth={2.2} />
        </RoundCtl>
        <Pressable onPress={toggleTimer}>
          {({ pressed }) => (
            <View style={[styles.play, pressed && styles.playPressed]}>
              <Icon name={running ? 'pause' : 'play'} size={34} color={colors.white} />
            </View>
          )}
        </Pressable>
        <RoundCtl label="+5 min" onPress={addFive}>
          <Icon name="plus" size={22} color={colors.teal} strokeWidth={2.2} />
        </RoundCtl>
      </View>

      {/* soundscape picker */}
      <BottomSheet
        visible={soundOpen}
        onClose={() => setSoundOpen(false)}
        title="Soundscape"
        subtitle="A steady background loop, stored on your device so it works offline."
      >
        {SOUNDS.map(([name, id, free]) => {
          const locked = !free && !s.profile.premium;
          const on = soundId === id;
          return (
            <Pressable
              key={id}
              onPress={() => pickSound(id, free, name)}
              style={[styles.soundRow, on && styles.soundRowOn]}
            >
              <View style={[styles.soundIc, on && { backgroundColor: colors.teal }]}>
                <Icon
                  name={id === 0 ? 'pause' : locked ? 'lock' : 'sound'}
                  size={17}
                  color={on ? colors.white : colors.teal}
                />
              </View>
              <Txt weight={700} size={14.5} color={colors.tealInk} style={{ flex: 1 }}>
                {name}
              </Txt>
              {locked ? (
                <Txt weight={800} size={11} color={colors.orange2}>Premium</Txt>
              ) : on ? (
                <Icon name="check" size={18} color={colors.teal} />
              ) : null}
            </Pressable>
          );
        })}
      </BottomSheet>
    </LinearGradient>
  );
}

function RoundCtl({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.ctl}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.roundbtn, pressed && { transform: [{ translateY: 2 }] }]}
      >
        {children}
      </Pressable>
      <View style={styles.ctlLabelWrap}>
        <Txt weight={700} size={11} color={colors.white} style={[styles.center, TEXT_SHADOW]}>
          {label}
        </Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  soundRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12,
    borderRadius: 14, borderWidth: 1.5, borderColor: colors.line2, backgroundColor: '#fff', marginBottom: 8,
  },
  soundRowOn: { borderColor: colors.teal, backgroundColor: '#F1F7F9' },
  soundIc: {
    width: 34, height: 34, borderRadius: 11, backgroundColor: colors.cream,
    alignItems: 'center', justifyContent: 'center',
  },
  root: { flex: 1, justifyContent: 'flex-start' },
  center: { textAlign: 'center' },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  iconbtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  mode: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 12,
    padding: 3,
    ...shadow.sm,
  },
  modeBtn: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 9 },
  modeBtnOn: { backgroundColor: colors.teal },
  qwrap: { paddingHorizontal: 16, marginTop: 4 },
  qtag: { marginTop: 2, opacity: 0.95 },
  main: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dial: { alignItems: 'center', justifyContent: 'center' },
  dialCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  phaseLbl: { letterSpacing: 0.5, textTransform: 'uppercase', opacity: 0.9, marginBottom: 2 },
  tnum: { letterSpacing: 1 },
  tlbl: { opacity: 0.9, marginTop: 2 },
  pomoNote: {
    marginTop: 8,
    backgroundColor: 'rgba(12,76,96,0.35)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  petGround: { alignItems: 'center', justifyContent: 'flex-end', marginTop: 6 },
  petCaption: {
    maxWidth: '82%',
    backgroundColor: 'rgba(12,76,96,0.32)',
    paddingVertical: 7,
    paddingHorizontal: 15,
    borderRadius: 999,
    marginBottom: 8,
  },
  petStage: { alignItems: 'center', justifyContent: 'flex-end' },
  petShadow: { position: 'absolute', bottom: '6%', backgroundColor: 'rgba(0,0,0,0.18)' },
  preview: { alignItems: 'center', marginBottom: 6 },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.16)',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    opacity: 0.95,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 30,
    paddingTop: 22,
  },
  ctl: { alignItems: 'center', justifyContent: 'center' },
  ctlLabelWrap: { position: 'absolute', top: '100%', marginTop: 8, left: -16, right: -16, alignItems: 'center' },
  roundbtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  play: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0C4C60',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  playPressed: { transform: [{ translateY: 4 }] },
});
