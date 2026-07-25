import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { Modal, View, Pressable, StyleSheet, ScrollView, Animated, Easing, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/tokens';
import { Txt } from './ui';

const H = Dimensions.get('window').height;

// Slide-up bottom sheet matching the prototype dialog: scrim fades in while the sheet
// slides up from the bottom (proto .slide-up), and slides back down on close
// (proto .slide-down). Never a plain fade.
export function BottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  align = 'center',
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  align?: 'center' | 'left';
}) {
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current; // 0 hidden, 1 shown
  const [render, setRender] = useState(visible);

  useEffect(() => {
    if (visible) {
      setRender(true);
      Animated.timing(anim, {
        toValue: 1, duration: 320, easing: Easing.bezier(0.2, 0.8, 0.2, 1), useNativeDriver: true,
      }).start();
    } else if (render) {
      Animated.timing(anim, {
        toValue: 0, duration: 240, easing: Easing.bezier(0.4, 0, 0.9, 0.5), useNativeDriver: true,
      }).start(({ finished }) => finished && setRender(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!render) return null;

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [H, 0] });

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[styles.scrim, { opacity: anim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[styles.dialog, { paddingBottom: 22 + insets.bottom, transform: [{ translateY }] }]}
        >
          <View style={styles.grip} />
          {title ? (
            <Txt weight={700} size={19} color={colors.tealInk} style={{ textAlign: align, marginBottom: 4 }}>
              {title}
            </Txt>
          ) : null}
          {subtitle ? (
            <Txt size={13.5} color={colors.muted} style={{ textAlign: align, marginBottom: 16, lineHeight: 20 }}>
              {subtitle}
            </Txt>
          ) : null}
          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>{children}</ScrollView>
        </Animated.View>
      </Animated.View>
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
