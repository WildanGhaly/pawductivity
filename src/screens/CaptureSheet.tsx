import React, { useRef, useState } from 'react';
import { View, TextInput, Pressable, StyleSheet, Animated } from 'react-native';
import { colors, radius, catColors, shadow } from '../theme/tokens';
import { Txt, Btn } from '../components/ui';
import { Icon } from '../components/Icon';
import { BottomSheet } from '../components/BottomSheet';
import { useStore } from '../store/store';
import { DURS, TAGS, CAP_REPS } from '../domain/catalogs';

// ---------- Brain Dump parser (deterministic, on-device) ----------
// Ported 1:1 from prototype/proto.clean.js parseText + inferTag. Returns the
// shape the store's addQuests accepts: { name, est, tag, repeat }.
const WDAY: Record<string, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
  fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
};

type ParsedQuest = { name: string; est: number; tag: string; repeat: boolean };

function inferTag(t: string): string {
  t = t.toLowerCase();
  if (/jog|run|gym|workout|exercise|walk|stretch|yoga|sport/.test(t)) return 'Sport';
  if (/essay|study|read|homework|class|lecture|exam|physics|math|assignment/.test(t)) return 'School';
  if (/report|email|meeting|deck|client|work|invoice|deploy|standup/.test(t)) return 'Work';
  if (/project/.test(t)) return 'Project';
  return 'Personal';
}

function parseText(raw: string): ParsedQuest[] {
  const parts = raw.split(/\s*(?:,|;|\band\b|\n)\s*/i).map((s) => s.trim()).filter(Boolean);
  const made: ParsedQuest[] = [];
  parts.forEach((txt) => {
    let est = 1500;
    let repeat = false;
    let m = txt.match(/~?\s*(\d+(?:\.\d+)?)\s*(hours?|hrs?|h)\b/i);
    if (m) {
      est = Math.round(parseFloat(m[1]) * 3600);
    } else {
      m = txt.match(/~?\s*(\d+)\s*(minutes?|mins?|min|m)\b/i);
      if (m) est = parseInt(m[1], 10) * 60;
    }
    // repeat detection, in priority order
    const ewd = txt.match(/\b(?:every|each)\s+(mon|tue|wed|thu|fri|sat|sun)[a-z]*\b/i)
      || txt.match(/\b(mon|tue|wed|thu|fri|sat|sun)[a-z]*s\b/i);
    if (ewd) {
      repeat = true;
    } else if (/\bweek ?days?\b|\bevery\s*week ?day\b/i.test(txt)) {
      repeat = true;
    } else if (/\bdaily\b|\bevery\s*day\b|\beach day\b/i.test(txt)) {
      repeat = true;
    }
    const tag = inferTag(txt);
    let name = txt
      .replace(/~?\s*\d+(?:\.\d+)?\s*(hours?|hrs?|h|minutes?|mins?|min|m)\b/ig, '')
      .replace(/\b(?:every|each)\s+(mon|tue|wed|thu|fri|sat|sun)[a-z]*\b/ig, '')
      .replace(/\b(mon|tue|wed|thu|fri|sat|sun)[a-z]*s\b/ig, '')
      .replace(/\bweek ?days?\b|\bevery\s*day\b|\bdaily\b|\beach day\b/ig, '')
      .replace(/\b(mon|tue|wed|thu|fri|sat|sun)[a-z]*day?\b/ig, '')
      .replace(/\bby\b/ig, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    name = name.replace(/^(and|,|on)\s*/i, '').trim();
    if (!name) name = 'New quest';
    name = name.charAt(0).toUpperCase() + name.slice(1);
    if (name.length > 50) name = name.slice(0, 50);
    made.push({ name, tag, est, repeat });
  });
  return made;
}

export function CaptureSheet() {
  const closeOverlay = useStore((st) => st.closeOverlay);
  const addQuest = useStore((st) => st.addQuest);
  const addQuests = useStore((st) => st.addQuests);
  const setTab = useStore((st) => st.setTab);
  const showToast = useStore((st) => st.showToast);

  const [mode, setMode] = useState<'quick' | 'dump'>('quick');
  const [title, setTitle] = useState('');
  const [dur, setDur] = useState<number>(1500);
  const [tag, setTag] = useState<string>('Personal');
  const [repeat, setRepeat] = useState<string>('once');
  const [text, setText] = useState('');

  // segmented toggle pill animation
  const [barW, setBarW] = useState(0);
  const slide = useRef(new Animated.Value(0)).current;
  const goMode = (m: 'quick' | 'dump') => {
    if (m === mode) return;
    setMode(m);
    Animated.timing(slide, {
      toValue: m === 'dump' ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };
  const pillW = barW > 0 ? (barW - 6) / 2 : 0;

  const commitQuick = () => {
    const t = title.trim();
    if (!t) { showToast('Give your quest a name'); return; }
    const name = t.charAt(0).toUpperCase() + t.slice(1);
    addQuest({ name, est: dur, tag, repeat: repeat !== 'once' });
    closeOverlay();
    setTab('quests');
    showToast('Quest added');
  };

  const commitDump = () => {
    const raw = text.trim();
    if (!raw) { showToast('Type something to capture first'); return; }
    const made = parseText(raw);
    addQuests(made);
    closeOverlay();
    setTab('quests');
    showToast(`${made.length} quest${made.length > 1 ? 's' : ''} added`);
  };

  return (
    <BottomSheet visible onClose={closeOverlay} title="Add a quest">
      {/* mode toggle */}
      <View style={styles.capmode} onLayout={(e) => setBarW(e.nativeEvent.layout.width)}>
        {pillW > 0 ? (
          <Animated.View
            style={[
              styles.capmodePill,
              { width: pillW, transform: [{ translateX: slide.interpolate({ inputRange: [0, 1], outputRange: [0, pillW] }) }] },
            ]}
          />
        ) : null}
        <Pressable style={styles.capmodeBtn} onPress={() => goMode('quick')}>
          <Txt weight={700} size={13} color={mode === 'quick' ? colors.teal : colors.muted}>
            Quick add
          </Txt>
        </Pressable>
        <Pressable style={styles.capmodeBtn} onPress={() => goMode('dump')}>
          <Txt weight={700} size={13} color={mode === 'dump' ? colors.teal : colors.muted}>
            Brain dump
          </Txt>
        </Pressable>
      </View>

      {mode === 'quick' ? (
        <View>
          <TextInput
            style={styles.field}
            value={title}
            onChangeText={setTitle}
            placeholder="What's the quest?"
            placeholderTextColor="#BDB8AB"
            maxLength={50}
          />

          <View style={[styles.pgroup, { marginTop: 15 }]}>
            <View style={styles.pglbl}>
              <Icon name="clock" size={14} color={colors.teal} />
              <Txt weight={700} size={12} color={colors.teal}>How long?</Txt>
            </View>
            <View style={styles.chipsRow}>
              {DURS.map(([l, v]) => {
                const on = dur === v;
                return (
                  <Pressable key={v} style={[styles.pchip, styles.chip5, on && styles.pchipOn]} onPress={() => setDur(v)}>
                    <Txt weight={700} size={13} color={on ? colors.orange2 : colors.tealInk}>{l}</Txt>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.pgroup}>
            <View style={styles.pglbl}>
              <Txt weight={700} size={12} color={colors.teal}>Category</Txt>
            </View>
            <View style={styles.chipsRow}>
              {TAGS.map((t) => {
                const on = tag === t;
                return (
                  <Pressable key={t} style={[styles.pchip, styles.chip3, on && styles.pchipOn]} onPress={() => setTag(t)}>
                    <View style={[styles.catdot, { backgroundColor: catColors[t] }]} />
                    <Txt weight={700} size={13} color={on ? colors.orange2 : colors.tealInk}>{t}</Txt>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.pgroup}>
            <View style={styles.pglbl}>
              <Icon name="repeat" size={14} color={colors.teal} />
              <Txt weight={700} size={12} color={colors.teal}>Repeat</Txt>
            </View>
            <View style={styles.chipsRow}>
              {CAP_REPS.map(([l, v]) => {
                const on = repeat === v;
                return (
                  <Pressable key={v} style={[styles.pchip, styles.chip3, on && styles.pchipOn]} onPress={() => setRepeat(v)}>
                    <Txt weight={700} size={13} color={on ? colors.orange2 : colors.tealInk}>{l}</Txt>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.actions}>
            <View style={{ flex: 1 }}>
              <Btn title="Cancel" variant="ghost" block onPress={closeOverlay} />
            </View>
            <View style={{ flex: 1 }}>
              <Btn title="Add quest" variant="orange" block onPress={commitQuick} />
            </View>
          </View>
        </View>
      ) : (
        <View>
          <Txt size={13.5} color={colors.muted} style={{ marginBottom: 12, lineHeight: 20 }}>
            One task per line. Time, repeats and tags are detected for you.
          </Txt>
          <TextInput
            style={[styles.field, styles.textarea]}
            value={text}
            onChangeText={setText}
            multiline
            textAlignVertical="top"
            placeholder={'finish physics essay ~2h\njog 30 min every weekday\ncall the bank'}
            placeholderTextColor="#BDB8AB"
          />
          <View style={styles.actions}>
            <View style={{ flex: 1 }}>
              <Btn title="Cancel" variant="ghost" block onPress={closeOverlay} />
            </View>
            <View style={{ flex: 1 }}>
              <Btn title="Add to Quests" variant="orange" block onPress={commitDump} />
            </View>
          </View>
        </View>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  capmode: {
    position: 'relative',
    flexDirection: 'row',
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.line2,
    borderRadius: 13,
    padding: 3,
    marginBottom: 16,
  },
  capmodePill: {
    position: 'absolute',
    top: 3,
    left: 3,
    bottom: 3,
    backgroundColor: '#fff',
    borderRadius: 10,
    ...shadow.sm,
  },
  capmodeBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: {
    width: '100%',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingVertical: 15,
    paddingHorizontal: 16,
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: colors.ink,
  },
  textarea: {
    minHeight: 110,
    lineHeight: 23,
  },
  pgroup: {
    marginBottom: 15,
  },
  pglbl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    marginLeft: 2,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pchip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: colors.line2,
  },
  pchipOn: {
    backgroundColor: '#FFF7EF',
    borderColor: colors.orange,
  },
  chip5: {
    flexGrow: 1,
    flexBasis: '17%',
  },
  chip3: {
    flexGrow: 1,
    flexBasis: '29%',
  },
  catdot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
});
