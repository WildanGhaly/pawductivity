import React, { ReactNode } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadow, NAV_H } from '../theme/tokens';
import { Txt } from './ui';
import { Icon } from './Icon';
import { useStore } from '../store/store';

// Shared chrome for every slide-up overlay screen: a sheet header (back button +
// centered title + optional right slot) over a scrollable body. Matches the
// prototype `.sheethead`. Back closes the overlay.
export function OverlayScreen({
  title,
  right,
  children,
  scroll = true,
  onBack,
}: {
  title: string;
  right?: ReactNode;
  children: ReactNode;
  scroll?: boolean;
  onBack?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const closeOverlay = useStore((s) => s.closeOverlay);
  const back = onBack || closeOverlay;

  return (
    <View style={styles.root}>
      <View style={[styles.head, { paddingTop: insets.top + 14 }]}>
        <Pressable style={styles.iconbtn} onPress={back}>
          <Icon name="chevL" size={18} color={colors.teal} strokeWidth={2.5} />
        </Pressable>
        <Txt weight={700} size={18} color={colors.tealInk} style={{ flex: 1 }}>{title}</Txt>
        {right ?? <View style={{ width: 40 }} />}
      </View>
      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: NAV_H + insets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  head: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  iconbtn: {
    width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.9)',
    alignItems: 'center', justifyContent: 'center', ...shadow.sm,
  },
});
