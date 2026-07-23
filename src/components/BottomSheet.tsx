import React, { ReactNode } from 'react';
import { Modal, View, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/tokens';
import { Txt } from './ui';

// Slide-up bottom sheet matching the prototype dialog (grip, rounded top, scrim).
export function BottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.scrim} onPress={onClose}>
        <Pressable style={[styles.dialog, { paddingBottom: 22 + insets.bottom }]} onPress={() => {}}>
          <View style={styles.grip} />
          {title ? (
            <Txt weight={700} size={19} color={colors.tealInk} style={{ textAlign: 'center', marginBottom: 4 }}>
              {title}
            </Txt>
          ) : null}
          {subtitle ? (
            <Txt size={13.5} color={colors.muted} style={{ textAlign: 'center', marginBottom: 16, lineHeight: 20 }}>
              {subtitle}
            </Txt>
          ) : null}
          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>{children}</ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(11,37,48,.5)', justifyContent: 'flex-end' },
  dialog: {
    backgroundColor: '#fff', borderTopLeftRadius: 26, borderTopRightRadius: 26, maxHeight: '90%',
    paddingHorizontal: 20, paddingTop: 22,
  },
  grip: { width: 40, height: 5, borderRadius: 9, backgroundColor: colors.line2, alignSelf: 'center', marginBottom: 16 },
});
