import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { colors } from '../theme/tokens';
import { Txt, Btn } from '../components/ui';
import { Icon } from '../components/Icon';
import { BottomSheet } from '../components/BottomSheet';
import { useStore } from '../store/store';
import { isDone, fmt } from '../domain/mechanics';

// Plan today sheet: pick up to 3 not-done quests to focus on today.
// Ported 1:1 from the prototype openPlan/planRows (proto.clean.js 670-692).
export function PlanSheet() {
  const s = useStore((st) => st.state)!;
  const closeOverlay = useStore((st) => st.closeOverlay);
  const togglePlan = useStore((st) => st.togglePlan);

  const active = s.quests.filter((q) => !isDone(q));

  const clear = () => {
    // No clearPlan action exists; toggle off every currently selected quest.
    s.plan.slice().forEach((id) => togglePlan(id));
  };

  return (
    <BottomSheet
      visible
      onClose={closeOverlay}
      title="Plan today"
      subtitle="Pick up to 3 to focus on today. We'll line them up smallest first, so starting is easy."
    >
      <View style={styles.planlist}>
        {active.map((q) => {
          const on = s.plan.includes(q.id);
          return (
            <Pressable
              key={q.id}
              onPress={() => togglePlan(q.id)}
              style={[styles.planrow, on && styles.planrowOn]}
            >
              <View style={[styles.planck, on && styles.planckOn]}>
                {on ? <Icon name="check" size={14} color="#fff" /> : null}
              </View>
              <Txt weight={700} size={13.5} color={colors.tealInk} style={styles.planname} numberOfLines={1}>
                {q.name}
              </Txt>
              <View style={styles.qtime}>
                <Icon name="clock" size={12} color={colors.muted} />
                <Txt weight={600} size={12} color={colors.muted}>{fmt(q.est)}</Txt>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.actions}>
        <Btn title="Clear" variant="ghost" block onPress={clear} style={{ flex: 1 }} />
        <Btn title="Done" variant="teal" block onPress={closeOverlay} style={{ flex: 1 }} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  planlist: { gap: 8 },
  planrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 13,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: colors.line2,
  },
  planrowOn: { borderColor: colors.teal, backgroundColor: '#F1F7F9' },
  planck: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.line2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planckOn: { backgroundColor: colors.teal, borderColor: colors.teal },
  planname: { flex: 1 },
  qtime: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
});
