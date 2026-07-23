import React from 'react';
import { View, Pressable, Image, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, NAV_H, shadow } from '../theme/tokens';
import { img } from '../assets/registry';
import { Txt } from './ui';
import { Icon } from './Icon';

export type TabKey = 'home' | 'quests' | 'pet' | 'cal';

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: 'home', label: 'Home', icon: img.navHome },
  { key: 'quests', label: 'Quests', icon: img.navQuests },
  { key: 'pet', label: 'Pet', icon: img.navPet },
  { key: 'cal', label: 'Calendar', icon: img.navCal },
];

export function TabBar({
  active,
  onTab,
  onCapture,
}: {
  active: TabKey;
  onTab: (t: TabKey) => void;
  onCapture: () => void;
}) {
  const insets = useSafeAreaInsets();
  const left = TABS.slice(0, 2);
  const right = TABS.slice(2);
  return (
    <View style={[styles.bar, { height: NAV_H + insets.bottom, paddingBottom: insets.bottom }]}>
      {left.map((t) => (
        <TabButton key={t.key} tab={t} active={active === t.key} onPress={() => onTab(t.key)} />
      ))}
      <View style={styles.fabSlot}>
        <Pressable
          onPress={onCapture}
          accessibilityLabel="Add a quest"
          style={({ pressed }) => [styles.fab, { transform: [{ translateY: pressed ? -14 : -18 }] }]}
        >
          <Icon name="plus" size={28} color="#fff" strokeWidth={3} />
        </Pressable>
      </View>
      {right.map((t) => (
        <TabButton key={t.key} tab={t} active={active === t.key} onPress={() => onTab(t.key)} />
      ))}
    </View>
  );
}

function TabButton({
  tab,
  active,
  onPress,
}: {
  tab: { key: TabKey; label: string; icon: any };
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.tabBtn} onPress={onPress}>
      {active && <View style={styles.activePill} />}
      <Image source={tab.icon} style={[styles.icon, { opacity: active ? 1 : 0.45 }]} resizeMode="contain" />
      <Txt weight={700} size={10.5} color={active ? colors.teal : colors.muted}>
        {tab.label}
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: colors.line,
    flexDirection: 'row',
    zIndex: 30,
    ...shadow.sm,
    shadowOffset: { width: 0, height: -6 },
  },
  tabBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  activePill: {
    position: 'absolute',
    top: '50%',
    width: 62,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#E4EFF3',
    marginTop: -29,
  },
  icon: { width: 24, height: 24 },
  fabSlot: { width: 62, alignItems: 'center', justifyContent: 'center' },
  fab: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.orange,
    borderWidth: 5,
    borderColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.orange,
    shadowOpacity: 0.5,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
});
