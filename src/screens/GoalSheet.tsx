import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { BottomSheet } from '../components/BottomSheet';
import { Btn, Txt } from '../components/ui';
import { useStore } from '../store/store';
import { colors, radius } from '../theme/tokens';

const OPTS = [30, 45, 60, 90, 120];

// Daily focus goal sheet: pick a target minute count for the day.
export function GoalSheet() {
  const s = useStore((st) => st.state)!;
  const closeOverlay = useStore((st) => st.closeOverlay);
  const setGoal = useStore((st) => st.setGoal);

  const current = s.today.goalMin;

  return (
    <BottomSheet
      visible
      onClose={closeOverlay}
      title="Daily focus goal"
      subtitle="How many minutes of focus feels like a good day? Small and steady beats heroic."
    >
      <View style={styles.chips}>
        {OPTS.map((m) => {
          const on = current === m;
          return (
            <Pressable
              key={m}
              onPress={() => setGoal(m)}
              style={[styles.chip, on && styles.chipOn]}
            >
              <Txt weight={700} size={13} color={on ? colors.orange2 : colors.tealInk}>
                {m}m
              </Txt>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.actions}>
        <Btn title="Done" block onPress={closeOverlay} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: radius.sm,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: colors.line2,
  },
  chipOn: {
    backgroundColor: '#FFF7EF',
    borderColor: colors.orange,
  },
  actions: {
    marginTop: 16,
  },
});
