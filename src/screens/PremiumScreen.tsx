import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { colors, radius, shadow } from '../theme/tokens';
import { Txt, Card, Btn } from '../components/ui';
import { Icon } from '../components/Icon';
import { OverlayScreen } from '../components/OverlayScreen';
import { useStore } from '../store/store';
import { PREMIUM_PLANS, PremiumPlan } from '../billing/products';
import { isBillingSupported, connectBilling, fetchPlans, BillingPlan } from '../billing/billing';

const BAR_HEIGHTS = [38, 62, 28, 80, 52, 96, 34];

const UNLOCKS = [
  'Focus insights: weekly charts, category mix, best hours',
  'Extra accent themes to personalize the app',
  'Rabbit companion',
  'Pizza treat, Tuxedo, Star Shirt and Pink Dress',
];

function PlanCard({
  plan,
  price,
  selected,
  onPress,
}: {
  plan: PremiumPlan;
  price: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Card
      onPress={onPress}
      style={[styles.plan, selected && { borderColor: colors.orange, backgroundColor: '#FFF7EF' }]}
    >
      {plan.best && (
        <View style={styles.bestBadge}>
          <Txt weight={800} size={9.5} color={colors.white} style={{ letterSpacing: 0.4 }}>
            BEST VALUE
          </Txt>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Txt weight={800} size={15.5} color={colors.tealInk}>{plan.title}</Txt>
        <Txt weight={600} size={11.5} color={colors.muted} style={{ marginTop: 2 }}>{plan.subtitle}</Txt>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Txt weight={800} size={15} color={colors.tealInk}>{price}</Txt>
        <Txt size={10.5} color={colors.muted}>{plan.fallbackPeriod}</Txt>
      </View>
    </Card>
  );
}

export function PremiumScreen() {
  const openOverlay = useStore((st) => st.openOverlay);
  const purchasePremium = useStore((st) => st.purchasePremium);
  const restorePremium = useStore((st) => st.restorePremium);
  const buyPremium = useStore((st) => st.buyPremium);
  const premium = useStore((st) => st.state?.profile.premium);

  const [selectedSku, setSelectedSku] = useState(PREMIUM_PLANS.find((p) => p.best)!.id);
  const [livePlans, setLivePlans] = useState<Record<string, BillingPlan>>({});
  const [busy, setBusy] = useState(false);
  const billingOk = isBillingSupported();

  // Load live Play prices when billing is available. Falls back to the catalog prices.
  useEffect(() => {
    if (!billingOk) return;
    let alive = true;
    (async () => {
      await connectBilling();
      const plans = await fetchPlans();
      if (!alive) return;
      const byId: Record<string, BillingPlan> = {};
      plans.forEach((p) => { byId[p.sku] = p; });
      setLivePlans(byId);
    })();
    return () => { alive = false; };
  }, [billingOk]);

  const priceFor = (p: PremiumPlan) => livePlans[p.id]?.price || p.fallbackPrice;

  const onContinue = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (billingOk) {
        await purchasePremium(selectedSku, livePlans[selectedSku]?.offerToken);
      } else {
        // Expo Go / web: no billing module. Keep premium content explorable.
        buyPremium();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <OverlayScreen title="Pawductivity Premium">
      <View style={styles.header}>
        <Icon name="crown" size={40} color={colors.yellow} />
        <Txt weight={800} size={23} color={colors.white} style={{ marginTop: 6 }}>
          Pawductivity Premium
        </Txt>
        <Txt weight={400} size={13.5} color={colors.sky} style={{ marginTop: 6, textAlign: 'center', lineHeight: 20 }}>
          Unlock every companion, outfit and deep insights. Premium items still cost coins, which you earn by focusing.
        </Txt>
        {premium && (
          <View style={styles.activePill}>
            <Icon name="check" size={13} color={colors.teal} strokeWidth={3} />
            <Txt weight={800} size={12} color={colors.teal}>Premium active</Txt>
          </View>
        )}
      </View>

      <View style={{ paddingTop: 18 }}>
        <Card onPress={() => openOverlay('insights')} style={styles.preview}>
          <View style={styles.previewHead}>
            <Txt weight={800} size={14} color={colors.tealInk}>Focus insights</Txt>
            <View style={styles.previewTag}>
              <Txt weight={800} size={10} color="#7A4B00" style={{ letterSpacing: 0.3 }}>Premium</Txt>
            </View>
          </View>
          <View style={styles.previewBars}>
            {BAR_HEIGHTS.map((h, i) => (
              <View key={i} style={styles.barTrack}><View style={[styles.bar, { height: `${h}%` }]} /></View>
            ))}
          </View>
          <Txt weight={600} size={12} color={colors.muted} style={{ lineHeight: 17 }}>
            See your focus time, category mix and best hours. Tap to preview.
          </Txt>
        </Card>

        <Card style={styles.checklist}>
          {UNLOCKS.map((line, i) => (
            <View key={i} style={styles.unlockRow}>
              <View style={styles.ck}><Icon name="check" size={12} color="#7A4B00" strokeWidth={3.5} /></View>
              <Txt weight={600} size={13.5} color={colors.tealInk} style={{ flex: 1 }}>{line}</Txt>
            </View>
          ))}
        </Card>

        {PREMIUM_PLANS.map((p) => (
          <PlanCard
            key={p.id}
            plan={p}
            price={priceFor(p)}
            selected={selectedSku === p.id}
            onPress={() => setSelectedSku(p.id)}
          />
        ))}

        <Btn
          title={busy ? 'Opening Google Play...' : premium ? 'Manage subscription' : 'Continue with Google Play'}
          block
          disabled={busy}
          left={busy ? <ActivityIndicator color={colors.white} size="small" /> : undefined}
          onPress={onContinue}
          style={{ marginTop: 8 }}
        />

        <Pressable onPress={restorePremium} style={{ paddingVertical: 10, alignItems: 'center' }}>
          <Txt weight={700} size={13} color={colors.teal}>Restore purchases</Txt>
        </Pressable>

        {!billingOk && (
          <Txt weight={600} size={11.5} color={colors.orange2} style={styles.devNote}>
            In-app purchases are not available in this build (Expo Go / web). Continue unlocks Premium locally for testing. Real Google Play billing works in a development or production build.
          </Txt>
        )}

        <Txt weight={400} size={11.5} color={colors.muted} style={styles.note}>
          Billed through Google Play. Your subscription is linked to your Google account, not this phone, so it restores on any device you sign in with. Cancel anytime in Play Store subscriptions.
        </Txt>
      </View>
    </OverlayScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginHorizontal: -16, marginTop: -16, backgroundColor: colors.teal,
    paddingHorizontal: 22, paddingTop: 22, paddingBottom: 26, alignItems: 'center',
  },
  activePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12,
    backgroundColor: colors.white, paddingVertical: 6, paddingHorizontal: 12, borderRadius: radius.pill,
  },
  preview: { padding: 0, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 16 },
  previewHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  previewTag: { backgroundColor: colors.yellow, paddingVertical: 3, paddingHorizontal: 8, borderRadius: radius.pill },
  previewBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 64, marginVertical: 8, marginTop: 12 },
  barTrack: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', backgroundColor: colors.teal2, borderTopLeftRadius: 5, borderTopRightRadius: 5, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
  checklist: { paddingHorizontal: 16, paddingVertical: 14, marginBottom: 18 },
  unlockRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  ck: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center' },
  plan: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 15, borderRadius: 18, borderColor: colors.line, borderWidth: 2, marginBottom: 11, ...shadow.sm },
  bestBadge: { position: 'absolute', top: -9, right: 14, backgroundColor: colors.orange, paddingVertical: 3, paddingHorizontal: 9, borderRadius: radius.pill },
  devNote: { textAlign: 'center', lineHeight: 16, paddingHorizontal: 20, marginTop: 6, marginBottom: 4 },
  note: { textAlign: 'center', lineHeight: 17, paddingHorizontal: 20, paddingTop: 4, marginTop: 10 },
});
