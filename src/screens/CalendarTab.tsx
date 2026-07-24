import React, { useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Image, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadow, NAV_H } from '../theme/tokens';
import { Txt, Card, CoinPill, Btn } from '../components/ui';
import { Icon } from '../components/Icon';
import { BottomSheet } from '../components/BottomSheet';
import { img, avatars } from '../assets/registry';
import { useStore } from '../store/store';
import type { Reminder, ReminderRep } from '../domain/types';

// ---- ported calendar helpers (from prototype: CALENDAR + REMINDERS) ----
const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEK_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DOWS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const REM_REPS: [string, ReminderRep][] = [
  ['Once', 'once'],
  ['Daily', 'daily'],
  ['Weekdays', 'weekdays'],
  ['Weekly', 'weekly'],
  ['Monthly', 'monthly'],
];

function remAnchor(r: Reminder) {
  const n = new Date();
  return {
    y: r.y !== undefined ? r.y : n.getFullYear(),
    mo: r.mo !== undefined ? r.mo : n.getMonth(),
    day: r.day || n.getDate(),
  };
}
function remOccurs(r: Reminder, y: number, m: number, d: number): boolean {
  const a = remAnchor(r);
  const t = new Date(y, m, d);
  const st = new Date(a.y, a.mo, a.day);
  if (t < st) return false; // never before it was created
  switch (r.rep) {
    case 'daily':
      return true;
    case 'weekdays': {
      const w = t.getDay();
      return w >= 1 && w <= 5;
    }
    case 'weekly':
      return t.getDay() === st.getDay();
    case 'monthly': {
      const last = new Date(y, m + 1, 0).getDate();
      return d === Math.min(a.day, last); // clamps to the last valid day
    }
    default:
      return t.getTime() === st.getTime();
  }
}
function remKey(y: number, m: number, d: number) {
  return y + '-' + m + '-' + d;
}
function remDoneOn(r: Reminder, y: number, m: number, d: number) {
  return Array.isArray(r.doneOn) && r.doneOn.includes(remKey(y, m, d));
}
function daysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}
function remInMonth(r: Reminder, y: number, m: number) {
  const days = daysInMonth(y, m);
  for (let d = 1; d <= days; d++) if (remOccurs(r, y, m, d)) return true;
  return false;
}
function remFirstIn(r: Reminder, y: number, m: number) {
  const days = daysInMonth(y, m);
  for (let d = 1; d <= days; d++) if (remOccurs(r, y, m, d)) return d;
  return 99;
}
function remNextIn(r: Reminder, y: number, m: number, from: number) {
  const days = daysInMonth(y, m);
  for (let d = Math.max(1, from); d <= days; d++) if (remOccurs(r, y, m, d)) return d;
  return 0;
}
function shortDate(y: number, m: number, d: number) {
  return MONTHS_SHORT[m] + ' ' + d;
}
function remLabel(r: Reminder) {
  const a = remAnchor(r);
  switch (r.rep) {
    case 'daily':
      return 'Every day';
    case 'weekdays':
      return 'Every weekday';
    case 'weekly':
      return 'Every ' + WEEK_FULL[new Date(a.y, a.mo, a.day).getDay()];
    case 'monthly':
      return 'Monthly on day ' + a.day;
    default:
      return shortDate(a.y, a.mo, a.day);
  }
}

export function CalendarTab() {
  const insets = useSafeAreaInsets();
  const s = useStore((st) => st.state)!;
  const addReminder = useStore((st) => st.addReminder);
  const toggleReminderDone = useStore((st) => st.toggleReminderDone);
  const showToast = useStore((st) => st.showToast);

  const now = new Date();
  const [cal, setCal] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [pick, setPick] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [dayOpen, setDayOpen] = useState<number | null>(null);

  // add-reminder form state
  const [remName, setRemName] = useState('');
  const [remTime, setRemTime] = useState('');
  const [remRep, setRemRep] = useState<ReminderRep>('once');
  const [remDay, setRemDay] = useState(1);

  const isCurMonth = cal.y === now.getFullYear() && cal.m === now.getMonth();

  // days that have a completed focus session (completedDays are offsets from today)
  const doneSet = useMemo(() => {
    const set = new Set<string>();
    s.completedDays.forEach((o) => {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + o);
      set.add(remKey(d.getFullYear(), d.getMonth(), d.getDate()));
    });
    return set;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.completedDays]);

  const shift = (delta: number) => {
    const nd = new Date(cal.y, cal.m + delta, 1);
    setCal({ y: nd.getFullYear(), m: nd.getMonth() });
  };
  const goToday = () => {
    setCal({ y: now.getFullYear(), m: now.getMonth() });
    setPick(false);
  };
  const setMonth = (mi: number) => {
    setCal((c) => ({ ...c, m: mi }));
    setPick(false);
  };
  const setYear = (delta: number) => setCal((c) => ({ ...c, y: c.y + delta }));

  // ---- build the month grid ----
  const first = new Date(cal.y, cal.m, 1).getDay();
  const totalDays = daysInMonth(cal.y, cal.m);
  const cells: (number | null)[] = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const openAdd = (day?: number) => {
    const useCur = cal.y === now.getFullYear() && cal.m === now.getMonth();
    setRemDay(typeof day === 'number' ? day : useCur ? now.getDate() : 1);
    setRemName('');
    setRemTime('');
    setRemRep('once');
    setDayOpen(null);
    setAddOpen(true);
  };

  const saveReminder = () => {
    const n = remName.trim();
    if (!n) {
      showToast('Give it a name first');
      return;
    }
    const t = remTime.trim() || '09:00';
    addReminder({ name: n, time: t, rep: remRep, y: cal.y, mo: cal.m, day: remDay });
    setAddOpen(false);
    const when = new Date(cal.y, cal.m, remDay).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    showToast(remRep === 'once' ? `Reminder set for ${when}` : `Reminder set, starting ${when}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView contentContainerStyle={{ paddingBottom: NAV_H + insets.bottom + 20 }} showsVerticalScrollIndicator={false}>
        {/* top bar */}
        <View style={[styles.topbar, { paddingTop: Math.max(20, insets.top + 12) }]}>
          <Pressable onPress={() => showToast('Profile coming soon')}>
            <Image source={avatars[s.profile.avatar] || img.catThumb} style={styles.avatarImg} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Txt weight={600} size={12} color={colors.muted}>Reminders and schedule</Txt>
            <Txt weight={800} size={20} color={colors.tealInk}>Calendar</Txt>
          </View>
          {!isCurMonth && (
            <Pressable style={styles.todaychip} onPress={goToday}>
              <Txt weight={800} size={12} color={colors.teal}>Today</Txt>
            </Pressable>
          )}
        </View>

        <View style={styles.pad}>
          {/* calendar card */}
          <View style={styles.calwrap}>
            <View style={styles.calhead}>
              <Pressable style={styles.iconbtn} onPress={() => shift(-1)}>
                <Icon name="chevL" size={15} color={colors.teal} strokeWidth={2.5} />
              </Pressable>
              <Pressable style={[styles.calmonth, pick && styles.calmonthOn]} onPress={() => setPick((v) => !v)}>
                <Txt weight={800} size={16} color={colors.tealInk}>{MONTHS_FULL[cal.m]} {cal.y}</Txt>
                <View style={{ transform: [{ rotate: pick ? '-90deg' : '90deg' }] }}>
                  <Icon name="chevR" size={13} color={colors.muted} strokeWidth={2.5} />
                </View>
              </Pressable>
              <Pressable style={styles.iconbtn} onPress={() => shift(1)}>
                <Icon name="chevR" size={15} color={colors.teal} strokeWidth={2.5} />
              </Pressable>
            </View>

            {pick ? (
              <View>
                <View style={styles.ystep}>
                  <Pressable style={styles.iconbtn} onPress={() => setYear(-1)}>
                    <Icon name="chevL" size={15} color={colors.teal} strokeWidth={2.5} />
                  </Pressable>
                  <Txt weight={800} size={17} color={colors.tealInk} style={styles.yval}>{cal.y}</Txt>
                  <Pressable style={styles.iconbtn} onPress={() => setYear(1)}>
                    <Icon name="chevR" size={15} color={colors.teal} strokeWidth={2.5} />
                  </Pressable>
                </View>
                <View style={styles.mygrid}>
                  {MONTHS_SHORT.map((mn, i) => {
                    const on = i === cal.m;
                    return (
                      <Pressable key={mn} style={[styles.mybtn, on && styles.mybtnOn]} onPress={() => setMonth(i)}>
                        <Txt weight={700} size={13} color={on ? '#fff' : colors.tealInk}>{mn}</Txt>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : (
              <View>
                <View style={styles.calgridRow}>
                  {DOWS.map((d, i) => (
                    <View key={i} style={styles.caldow}>
                      <Txt weight={700} size={10.5} color={colors.muted}>{d}</Txt>
                    </View>
                  ))}
                </View>
                {weeks.map((wk, wi) => (
                  <View key={wi} style={styles.calgridRow}>
                    {wk.map((d, di) => {
                      if (d === null) return <View key={di} style={styles.calcell} />;
                      const isToday = isCurMonth && d === now.getDate();
                      const done = doneSet.has(remKey(cal.y, cal.m, d));
                      const hasRem = s.reminders.some((r) => remOccurs(r, cal.y, cal.m, d) && !remDoneOn(r, cal.y, cal.m, d));
                      return (
                        <View key={di} style={styles.calcell}>
                          <Pressable style={[styles.calday, isToday && styles.caldayToday]} onPress={() => setDayOpen(d)}>
                            <Txt weight={isToday ? 800 : 600} size={13} color={isToday ? '#fff' : colors.ink}>{d}</Txt>
                            {(done || hasRem) && (
                              <View style={styles.dotRow}>
                                {done && <View style={[styles.dot, { backgroundColor: isToday ? '#fff' : colors.good }]} />}
                                {hasRem && <View style={[styles.dot, { backgroundColor: colors.orange }]} />}
                              </View>
                            )}
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                ))}
                <View style={styles.heatlegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.good }]} />
                    <Txt weight={600} size={11} color={colors.muted}>Completed</Txt>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.orange }]} />
                    <Txt weight={600} size={11} color={colors.muted}>Reminder</Txt>
                  </View>
                  <Txt weight={600} size={11} color={colors.muted}>Change month above</Txt>
                </View>
              </View>
            )}
          </View>

          {/* reminders list */}
          <View style={styles.shead}>
            <Txt weight={700} size={16} color={colors.tealInk}>Reminders</Txt>
            <Txt weight={700} size={12.5} color={colors.orange} onPress={() => openAdd()}>+ Add</Txt>
          </View>
          <RemindersList
            reminders={s.reminders}
            y={cal.y}
            m={cal.m}
            now={now}
            isCur={isCurMonth}
            onToggle={(id, key) => toggleReminderDone(id, key)}
            onOpenDay={(d) => setDayOpen(d)}
          />
        </View>
      </ScrollView>

      {/* day detail sheet */}
      <BottomSheet
        visible={dayOpen !== null}
        onClose={() => setDayOpen(null)}
        title={dayOpen !== null ? new Date(cal.y, cal.m, dayOpen).toLocaleString('en-US', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}
        subtitle={
          dayOpen !== null
            ? doneSet.has(remKey(cal.y, cal.m, dayOpen))
              ? 'You completed a focus session on this day.'
              : 'No focus sessions logged this day.'
            : ''
        }
      >
        {dayOpen !== null && (
          <DayList
            reminders={s.reminders}
            y={cal.y}
            m={cal.m}
            d={dayOpen}
            onToggle={(id, key) => toggleReminderDone(id, key)}
          />
        )}
        <View style={styles.dactions}>
          <Btn title="Close" variant="ghost" block style={{ flex: 1 }} onPress={() => setDayOpen(null)} />
          <Btn title="Add reminder" block style={{ flex: 1 }} onPress={() => openAdd(dayOpen ?? undefined)} />
        </View>
      </BottomSheet>

      {/* add-reminder sheet */}
      <BottomSheet visible={addOpen} onClose={() => setAddOpen(false)} title="New reminder">
        <Txt weight={700} size={12.5} color={colors.teal} style={styles.label}>What's the reminder?</Txt>
        <TextInput
          style={styles.field}
          value={remName}
          onChangeText={setRemName}
          placeholder="e.g. Take a break"
          placeholderTextColor="#BDB8AB"
        />
        <Txt weight={700} size={12.5} color={colors.teal} style={[styles.label, { marginTop: 14 }]}>Time</Txt>
        <TextInput
          style={styles.field}
          value={remTime}
          onChangeText={setRemTime}
          placeholder="e.g. 09:00"
          placeholderTextColor="#BDB8AB"
          keyboardType="numbers-and-punctuation"
        />
        <Txt weight={700} size={12.5} color={colors.teal} style={[styles.label, { marginTop: 14 }]}>Repeat</Txt>
        <View style={styles.pchips}>
          {REM_REPS.map(([l, v]) => {
            const on = remRep === v;
            return (
              <Pressable key={v} style={[styles.pchip, on && styles.pchipOn]} onPress={() => setRemRep(v)}>
                <Txt weight={700} size={13} color={on ? colors.orange2 : colors.tealInk}>{l}</Txt>
              </Pressable>
            );
          })}
        </View>
        <View style={[styles.dactions, { marginTop: 16 }]}>
          <Btn title="Cancel" variant="ghost" block style={{ flex: 1 }} onPress={() => setAddOpen(false)} />
          <Btn title="Add reminder" block style={{ flex: 1 }} onPress={saveReminder} />
        </View>
      </BottomSheet>
    </View>
  );
}

// ---- reminders list for the visible month (calRemsHTML port) ----
function RemindersList({
  reminders,
  y,
  m,
  now,
  isCur,
  onToggle,
  onOpenDay,
}: {
  reminders: Reminder[];
  y: number;
  m: number;
  now: Date;
  isCur: boolean;
  onToggle: (id: number, key: string) => void;
  onOpenDay: (d: number) => void;
}) {
  const list = reminders
    .filter((r) => remInMonth(r, y, m))
    .sort((a, b) => remFirstIn(a, y, m) - remFirstIn(b, y, m) || a.time.localeCompare(b.time));

  if (!list.length) {
    return (
      <View style={styles.empty}>
        <View style={styles.emIc}>
          <Icon name="calendar" size={40} color={colors.line2} />
        </View>
        <Txt weight={700} size={15} color={colors.tealInk} style={{ marginBottom: 4 }}>No reminders</Txt>
        <Txt size={13} color={colors.muted}>Nothing scheduled in {MONTHS_FULL[m]}.</Txt>
      </View>
    );
  }

  return (
    <View>
      {list.map((r) => {
        const once = !r.rep || r.rep === 'once';
        const today = isCur && remOccurs(r, y, m, now.getDate());
        // you can only tick something that is due: today for repeats, its own date for one-offs
        const actDay = once ? remFirstIn(r, y, m) : today ? now.getDate() : 0;
        const done = actDay && actDay < 99 ? remDoneOn(r, y, m, actDay) : false;
        const nextD = remNextIn(r, y, m, isCur ? now.getDate() : 1);
        const nextTxt = nextD ? shortDate(y, m, nextD) : '';
        const canTick = !!actDay && actDay < 99;
        const dueNow = canTick && isCur && actDay === now.getDate();
        const state = dueNow ? (done ? ' · done today' : ' · due today') : done ? ' · done' : '';
        const sub = once ? remLabel(r) + state : remLabel(r) + (today ? state : nextTxt ? ' · next ' + nextTxt : '');
        const openD = nextD || (actDay < 99 ? actDay : 1);
        const rowPress = () => {
          if (canTick) onToggle(r.id, remKey(y, m, actDay));
          else onOpenDay(openD);
        };
        return (
          <Pressable key={r.id} style={styles.remitem} onPress={rowPress}>
            <Txt weight={800} size={13} color={colors.orange2} style={styles.rtime}>{r.time}</Txt>
            <View style={styles.rn}>
              <Txt weight={600} size={14} color={done ? colors.muted : colors.tealInk} style={done ? styles.strike : undefined}>{r.name}</Txt>
              <Txt weight={700} size={11} color={done ? colors.line2 : colors.muted} style={{ marginTop: 2 }}>{sub}</Txt>
            </View>
            {canTick ? (
              <Pressable style={[styles.rcheck, done && styles.rcheckOn]} onPress={() => onToggle(r.id, remKey(y, m, actDay))}>
                {done && <Icon name="check" size={15} color="#fff" strokeWidth={3} />}
              </Pressable>
            ) : (
              <View style={styles.rrep}>
                <Icon name="repeat" size={15} color={colors.teal} />
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

// ---- single-day reminder list (dayListHTML port) ----
function DayList({
  reminders,
  y,
  m,
  d,
  onToggle,
}: {
  reminders: Reminder[];
  y: number;
  m: number;
  d: number;
  onToggle: (id: number, key: string) => void;
}) {
  const rems = reminders.filter((r) => remOccurs(r, y, m, d)).sort((a, b) => a.time.localeCompare(b.time));
  if (!rems.length) {
    return (
      <View style={[styles.empty, { paddingVertical: 14 }]}>
        <View style={styles.emIc}>
          <Icon name="bell" size={30} color={colors.line2} />
        </View>
        <Txt size={13} color={colors.muted}>Nothing scheduled for this day.</Txt>
      </View>
    );
  }
  return (
    <View>
      {rems.map((r) => {
        const done = remDoneOn(r, y, m, d);
        return (
          <Pressable key={r.id} style={[styles.remitem, { marginBottom: 8 }]} onPress={() => onToggle(r.id, remKey(y, m, d))}>
            <Txt weight={800} size={13} color={colors.orange2} style={styles.rtime}>{r.time}</Txt>
            <View style={styles.rn}>
              <Txt weight={600} size={14} color={done ? colors.muted : colors.tealInk} style={done ? styles.strike : undefined}>{r.name}</Txt>
              {r.rep && r.rep !== 'once' && (
                <Txt weight={700} size={11} color={done ? colors.line2 : colors.muted} style={{ marginTop: 2 }}>{remLabel(r)}</Txt>
              )}
            </View>
            <Pressable style={[styles.rcheck, done && styles.rcheckOn]} onPress={() => onToggle(r.id, remKey(y, m, d))}>
              {done && <Icon name="check" size={15} color="#fff" strokeWidth={3} />}
            </Pressable>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 8 },
  avatarImg: { width: 44, height: 44, borderRadius: 22, borderWidth: 2.5, borderColor: '#fff', backgroundColor: '#DDEDE9' },
  pad: { paddingHorizontal: 16, paddingTop: 6 },
  todaychip: { backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.line2, paddingVertical: 7, paddingHorizontal: 13, borderRadius: 999 },

  calwrap: { backgroundColor: '#fff', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: colors.line, ...shadow.sm },
  calhead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8 },
  iconbtn: { width: 32, height: 32, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', ...shadow.sm },
  calmonth: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 12 },
  calmonthOn: { backgroundColor: colors.cream },

  ystep: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, marginTop: 4, marginBottom: 12 },
  yval: { minWidth: 56, textAlign: 'center' },
  mygrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mybtn: { width: '22%', flexGrow: 1, paddingVertical: 12, paddingHorizontal: 4, borderRadius: 12, backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.line2, alignItems: 'center' },
  mybtnOn: { backgroundColor: colors.teal, borderColor: colors.teal },

  calgridRow: { flexDirection: 'row', gap: 4, marginBottom: 4 },
  caldow: { flex: 1, alignItems: 'center', paddingBottom: 4 },
  calcell: { flex: 1, aspectRatio: 1 },
  calday: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
  caldayToday: { backgroundColor: colors.teal },
  dotRow: { position: 'absolute', bottom: 5, flexDirection: 'row', gap: 3, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 5, height: 5, borderRadius: 2.5 },

  heatlegend: { flexDirection: 'row', gap: 14, justifyContent: 'center', alignItems: 'center', marginTop: 12, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },

  shead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, marginBottom: 10, marginHorizontal: 2 },

  remitem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: colors.line, marginBottom: 10, ...shadow.sm },
  rtime: { minWidth: 52 },
  rn: { flex: 1, minWidth: 0 },
  strike: { textDecorationLine: 'line-through' },
  rcheck: { width: 26, height: 26, borderRadius: 9, borderWidth: 2, borderColor: colors.line2, alignItems: 'center', justifyContent: 'center' },
  rcheckOn: { backgroundColor: colors.good, borderColor: colors.good },
  rrep: { width: 26, height: 26, borderRadius: 9, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },

  empty: { alignItems: 'center', paddingVertical: 34, paddingHorizontal: 20 },
  emIc: { marginBottom: 8 },

  label: { marginBottom: 7, marginLeft: 4 },
  field: { width: '100%', backgroundColor: '#fff', borderWidth: 2, borderColor: colors.line, borderRadius: 16, paddingVertical: 15, paddingHorizontal: 16, fontFamily: 'Poppins-Regular', fontSize: 15, color: colors.ink },
  pchips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pchip: { width: '31%', flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 9, paddingHorizontal: 6, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1.5, borderColor: colors.line2 },
  pchipOn: { backgroundColor: '#FFF7EF', borderColor: colors.orange },

  dactions: { flexDirection: 'row', gap: 10, marginTop: 16 },
});
