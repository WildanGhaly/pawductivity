import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  ImageBackground,
  Share,
} from 'react-native';
import { colors, radius, font } from '../theme/tokens';
import { Txt, Btn } from '../components/ui';
import { Icon } from '../components/Icon';
import { OverlayScreen } from '../components/OverlayScreen';
import { img } from '../assets/registry';
import { useStore } from '../store/store';

export function ReferralScreen() {
  const showToast = useStore((st) => st.showToast);
  const redeemReferral = useStore((st) => st.redeemReferral);
  const fetchReferralCode = useStore((st) => st.fetchReferralCode);
  const [code, setCode] = useState('');
  // The invite code is issued by the server so it is unique per device. Until it
  // answers (or when offline) we show a placeholder rather than a fake code.
  const [myCode, setMyCode] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    fetchReferralCode().then((c) => { if (alive) setMyCode(c); });
    return () => { alive = false; };
  }, [fetchReferralCode]);

  const share = async () => {
    if (!myCode) { showToast('Connect to get your code first'); return; }
    try {
      await Share.share({ message: `Join me on Pawductivity and grow a focus buddy. Use my invite code ${myCode} on your first day and we both get 100 coins.` });
    } catch {
      showToast('Could not open the share sheet');
    }
  };
  const redeem = () => redeemReferral(code);

  return (
    <OverlayScreen title="Invite friends">
      <ImageBackground
        source={img.referralBg}
        style={styles.refcard}
        imageStyle={{ borderRadius: radius.lg }}
        resizeMode="cover"
      >
        <View style={styles.refcardTint} />
        <View style={styles.refcardBody}>
          <Txt weight={800} size={15} color={colors.white}>
            Give 100 coins, get 100 coins
          </Txt>
          <Txt weight={400} size={12.5} color="#D6EEF7" style={styles.refcardSub}>
            Share your code. When a friend enters it on their first day, you both
            get a coin boost.
          </Txt>
          <View style={styles.refcode}>
            <Txt weight={800} size={18} color={colors.white} style={styles.refcodeText}>
              {myCode ?? 'Connect to get your code'}
            </Txt>
          </View>
          <Pressable onPress={share} style={styles.shareShade}>
            {({ pressed }) => (
              <View style={[styles.shareFace, pressed && { transform: [{ translateY: 3 }] }]}>
                <Txt weight={700} size={15} color={colors.teal}>
                  Share invite
                </Txt>
              </View>
            )}
          </Pressable>
        </View>
      </ImageBackground>

      <View style={styles.shead}>
        <Txt weight={700} size={16} color={colors.tealInk}>
          Have a code?
        </Txt>
      </View>

      <TextInput
        style={styles.field}
        placeholder="Enter a friend's code"
        placeholderTextColor="#BDB8AB"
        value={code}
        onChangeText={(t) => setCode(t.toUpperCase())}
        autoCapitalize="characters"
        autoCorrect={false}
      />

      <Btn title="Redeem code" variant="teal" block onPress={redeem} style={{ marginTop: 10 }} />

      <View style={styles.offnote}>
        <Icon name="offline" size={15} color={colors.teal} strokeWidth={2} />
        <Txt weight={600} size={11.5} color={colors.muted} style={styles.offnoteText}>
          Sharing and redeeming need internet, so a code can be verified once.
          Everything else in Pawductivity works offline.
        </Txt>
      </View>
    </OverlayScreen>
  );
}

const styles = StyleSheet.create({
  refcard: {
    borderRadius: radius.lg,
    padding: 18,
    overflow: 'hidden',
  },
  refcardTint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(12,76,96,.55)',
  },
  refcardBody: {
    position: 'relative',
  },
  refcardSub: {
    marginTop: 4,
    lineHeight: 19,
  },
  refcode: {
    backgroundColor: 'rgba(255,255,255,.16)',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,.5)',
    borderRadius: radius.sm,
    paddingVertical: 11,
    alignItems: 'center',
    marginVertical: 10,
  },
  refcodeText: {
    letterSpacing: 3,
  },
  shareShade: {
    borderRadius: radius.md,
    backgroundColor: 'rgba(0,0,0,.15)',
    paddingBottom: 5,
  },
  shareFace: {
    borderRadius: radius.md,
    backgroundColor: colors.white,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shead: {
    marginTop: 18,
    marginBottom: 10,
    marginHorizontal: 2,
  },
  field: {
    width: '100%',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingVertical: 15,
    paddingHorizontal: 16,
    fontFamily: font.bold,
    fontSize: 16,
    color: colors.ink,
  },
  offnote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 14,
    paddingVertical: 11,
    paddingHorizontal: 13,
    borderRadius: radius.sm,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.line2,
  },
  offnoteText: {
    flex: 1,
    lineHeight: 17,
  },
});
