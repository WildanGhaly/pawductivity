import React from 'react';
import { View, Image, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/tokens';
import { Txt, Btn } from '../components/ui';
import { Icon } from '../components/Icon';
import { BottomSheet } from '../components/BottomSheet';
import { foodImg } from '../assets/registry';
import { FOODS } from '../domain/catalogs';
import { bonusPct } from '../domain/mechanics';
import { useStore } from '../store/store';

// Feed dialog (proto openFeed): the SAME sheet is opened from Home and Pet. Shows the
// food inventory grid (or an empty state) and a Buy-food shortcut into the shop.
// The health>=100 "already full" guard lives at the call site (the Feed button).
export function FeedSheet({ visible = true }: { visible?: boolean; param?: any }) {
  const s = useStore((st) => st.state)!;
  const feed = useStore((st) => st.feed);
  const openOverlay = useStore((st) => st.openOverlay);
  const closeOverlay = useStore((st) => st.closeOverlay);
  const pet = s.pet;
  const bp = bonusPct(pet.health);
  const anyFood = FOODS.some((f) => (pet.food[f.id] || 0) > 0);
  const doFeed = (id: number) => { feed(id); closeOverlay(); };

  return (
    <BottomSheet
      visible={visible}
      onClose={closeOverlay}
      title={`Feed ${pet.name}`}
      subtitle={`Health ${pet.health}/100 · a happier pet means a bigger focus reward (now +${bp}%)`}
    >
      {anyFood ? (
        <View style={styles.feedgrid}>
          {FOODS.map((f) => {
            const qty = pet.food[f.id] || 0;
            return (
              <Pressable key={f.id} style={[styles.fooditem, qty <= 0 && { opacity: 0.4 }]} disabled={qty <= 0} onPress={() => doFeed(f.id)}>
                {qty > 0 && <View style={styles.fq}><Txt weight={800} size={10} color={colors.teal}>×{qty}</Txt></View>}
                <Image source={foodImg[f.id]} style={{ width: 46, height: 46 }} resizeMode="contain" />
                <Txt weight={700} size={11} color={colors.tealInk}>{f.name}</Txt>
                <Txt weight={700} size={10.5} color={colors.good}>+{f.heal}</Txt>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={{ alignItems: 'center', padding: 14 }}>
          <Icon name="bag" size={34} color={colors.line2} />
          <Txt weight={700} color={colors.tealInk} style={{ marginTop: 8 }}>No food yet</Txt>
          <Txt size={12} color={colors.muted}>Grab some snacks from the shop.</Txt>
        </View>
      )}
      <View style={styles.dactions}>
        <Btn title="Close" variant="ghost" block style={{ flex: 1 }} onPress={closeOverlay} />
        <Btn title="Buy food" block style={{ flex: 1 }} onPress={() => { closeOverlay(); openOverlay('shop', { tab: 'food' }); }} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  feedgrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 },
  fooditem: { width: '31%', flexGrow: 1, backgroundColor: colors.cream, borderRadius: 16, paddingVertical: 10, alignItems: 'center', borderWidth: 2, borderColor: colors.line },
  fq: { position: 'absolute', top: 4, right: 4, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line2, paddingVertical: 1, paddingHorizontal: 6, borderRadius: 999, zIndex: 1 },
  dactions: { flexDirection: 'row', gap: 10, marginTop: 16 },
});
