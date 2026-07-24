import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radius, shadow } from '../theme/tokens';
import { Txt, Card, Btn } from '../components/ui';
import { Icon } from '../components/Icon';
import { OverlayScreen } from '../components/OverlayScreen';
import { useStore } from '../store/store';

type PlanKey = '1 month' | '1 year' | '6 months';

const BAR_HEIGHTS = [38, 62, 28, 80, 52, 96, 34];

const UNLOCKS = [
  'Focus insights: weekly charts, category mix, best hours',
  'Extra accent themes to personalize the app',
  'Rabbit companion',
  'Pizza treat, Tuxedo, Star Shirt and Pink Dress',
];

function PlanCard({
  dur,
  sub,
  price,
  per,
  selected,
  best,
  onPress,
}: {
  dur: string;
  sub: string;
  price: string;
  per: string;
  selected: boolean;
  best?: boolean;
  onPress: () => void;
}) {
  return (
    <Card
      onPress={onPress}
      style={[
        styles.plan,
        selected && { borderColor: colors.orange, backgroundColor: '#FFF7EF' },
      ]}
    >
      {best && (
        <View style={styles.bestBadge}>
          <Txt weight={800} size={9.5} color={colors.white} style={{ letterSpacing: 0.4 }}>
            BEST VALUE
          </Txt>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Txt weight={800} size={15.5} color={colors.tealInk}>
          {dur}
        </Txt>
        <Txt weight={600} size={11.5} color={colors.muted} style={{ marginTop: 2 }}>
          {sub}
        </Txt>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Txt weight={800} size={15} color={colors.tealInk}>
          {price}
        </Txt>
        <Txt size={10.5} color={colors.muted}>
          {per}
        </Txt>
      </View>
    </Card>
  );
}

export function PremiumScreen() {
  const openOverlay = useStore((st) => st.openOverlay);
  const buyPremium = useStore((st) => st.buyPremium);
  const [plan, setPlan] = useState<PlanKey>('1 year');

  return (
    <OverlayScreen title="Pawductivity Premium">
      {/* Teal header block (full-bleed above the padded body) */}
      <View style={styles.header}>
        <Icon name="crown" size={40} color={colors.yellow} />
        <Txt weight={800} size={23} color={colors.white} style={{ marginTop: 6 }}>
          Pawductivity Premium
        </Txt>
        <Txt
          weight={400}
          size={13.5}
          color={colors.sky}
          style={{ marginTop: 6, textAlign: 'center', lineHeight: 20 }}
        >
          Unlock every companion, outfit and deep insights. Premium items still cost coins,
          which you earn by focusing.
        </Txt>
      </View>

      <View style={{ paddingTop: 18 }}>
        {/* Insights preview */}
        <Card onPress={() => openOverlay('insights')} style={styles.preview}>
          <View style={styles.previewHead}>
            <Txt weight={800} size={14} color={colors.tealInk}>
              Focus insights
            </Txt>
            <View style={styles.previewTag}>
              <Txt weight={800} size={10} color="#7A4B00" style={{ letterSpacing: 0.3 }}>
                Premium
              </Txt>
            </View>
          </View>
          <View style={styles.previewBars}>
            {BAR_HEIGHTS.map((h, i) => (
              <View key={i} style={styles.barTrack}>
                <View style={[styles.bar, { height: `${h}%` }]} />
              </View>
            ))}
          </View>
          <Txt weight={600} size={12} color={colors.muted} style={{ lineHeight: 17 }}>
            See your focus time, category mix and best hours. Tap to preview.
          </Txt>
        </Card>

        {/* Unlock checklist */}
        <Card style={styles.checklist}>
          {UNLOCKS.map((line, i) => (
            <View key={i} style={styles.unlockRow}>
              <View style={styles.ck}>
                <Icon name="check" size={12} color="#7A4B00" strokeWidth={3.5} />
              </View>
              <Txt weight={600} size={13.5} color={colors.tealInk} style={{ flex: 1 }}>
                {line}
              </Txt>
            </View>
          ))}
        </Card>

        {/* Plan cards */}
        <PlanCard
          dur="1 Month"
          sub="Try it out"
          price="Rp 15.000"
          per="/month"
          selected={plan === '1 month'}
          onPress={() => setPlan('1 month')}
        />
        <PlanCard
          dur="1 Year"
          sub="Rp 9.900 / month"
          price="Rp 119.000"
          per="/year"
          best
          selected={plan === '1 year'}
          onPress={() => setPlan('1 year')}
        />
        <PlanCard
          dur="6 Months"
          sub="Rp 11.500 / month"
          price="Rp 69.000"
          per="/6 mo"
          selected={plan === '6 months'}
          onPress={() => setPlan('6 months')}
        />

        <Btn
          title="Continue with Google Play"
          block
          onPress={() => buyPremium()}
          style={{ marginTop: 8 }}
        />

        <Txt weight={400} size={11.5} color={colors.muted} style={styles.note}>
          Billed through Google Play. Your subscription is linked to your Google account, not
          this phone, so it restores on any device you sign in with. Cancel anytime in Play
          Store subscriptions. Prices are illustrative.
        </Txt>
      </View>
    </OverlayScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginHorizontal: -16,
    marginTop: -16,
    backgroundColor: colors.teal,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 26,
    alignItems: 'center',
  },
  preview: {
    padding: 0,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  previewHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewTag: {
    backgroundColor: colors.yellow,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
  },
  previewBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    height: 64,
    marginVertical: 8,
    marginTop: 12,
  },
  barTrack: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    backgroundColor: colors.teal2,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  checklist: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 18,
  },
  unlockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
  },
  ck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 15,
    borderRadius: 18,
    borderColor: colors.line,
    borderWidth: 2,
    marginBottom: 11,
    ...shadow.sm,
  },
  bestBadge: {
    position: 'absolute',
    top: -9,
    right: 14,
    backgroundColor: colors.orange,
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: radius.pill,
  },
  note: {
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 20,
    paddingTop: 4,
    marginTop: 10,
  },
});
