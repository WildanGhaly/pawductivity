import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { colors, radius } from '../theme/tokens';
import { Txt, Btn } from '../components/ui';
import { BottomSheet } from '../components/BottomSheet';
import { FOODS, CLOTHES, SPECIES } from '../domain/catalogs';
import { img, foodImg, clothesImg, speciesThumb } from '../assets/registry';
import { useStore } from '../store/store';

// Purchase-confirmation dialog (proto buyDialog): item art + name, Price and Your
// balance rows, Cancel / Buy now. Premium-locked items show the "Go Premium" upsell;
// too-poor shows how many more coins are needed. Nothing is bought until confirmed.
export function BuySheet({
  param,
  visible = true,
}: {
  param?: { kind: 'food' | 'clothes' | 'pet'; id: number };
  visible?: boolean;
}) {
  const s = useStore((st) => st.state)!;
  const closeOverlay = useStore((st) => st.closeOverlay);
  const openOverlay = useStore((st) => st.openOverlay);
  const buyFood = useStore((st) => st.buyFood);
  const buyClothes = useStore((st) => st.buyClothes);
  const buyPet = useStore((st) => st.buyPet);

  const kind = param?.kind ?? 'food';
  const id = param?.id ?? 0;
  const coins = s.profile.coins;

  let name = '';
  let price = 0;
  let art: any = img.coin;
  let premium = false;
  if (kind === 'food') {
    const f = FOODS.find((x) => x.id === id);
    if (f) { name = f.name; price = f.price; art = foodImg[f.id]; premium = !!f.premium; }
  } else if (kind === 'clothes') {
    const c = CLOTHES.find((x) => x.id === id);
    if (c) { name = c.name; price = c.price; art = clothesImg[c.id]; premium = !!c.premium; }
  } else {
    const p = SPECIES.find((x) => x.id === id);
    if (p) { name = p.name; price = p.price; art = speciesThumb[p.key]; premium = !!p.premium; }
  }

  const locked = premium && !s.profile.premium;
  const poor = !locked && coins < price;

  const doBuy = () => {
    if (kind === 'food') buyFood(id);
    else if (kind === 'clothes') buyClothes(id);
    else buyPet(id);
    closeOverlay();
  };

  return (
    <BottomSheet visible={visible} onClose={closeOverlay} title={locked ? 'Premium item' : `Buy ${name}?`}>
      <View style={styles.art}>
        <Image source={art} style={{ width: 96, height: 96 }} resizeMode="contain" />
      </View>

      {locked ? (
        <>
          <Txt weight={600} size={13} color={colors.orange2} style={styles.msg}>
            Premium content. Subscribe to unlock this item.
          </Txt>
          <View style={styles.row}>
            <Btn title="Not now" variant="ghost" block style={{ flex: 1 }} onPress={closeOverlay} />
            <Btn title="Go Premium" block style={{ flex: 1 }} onPress={() => { closeOverlay(); openOverlay('premium'); }} />
          </View>
        </>
      ) : poor ? (
        <>
          <Txt weight={600} size={13} color={colors.muted} style={styles.msg}>
            Not enough coins. You need {price - coins} more.
          </Txt>
          <Btn title="Not now" variant="ghost" block onPress={closeOverlay} />
        </>
      ) : (
        <>
          <View style={styles.line}>
            <Txt weight={600} size={13.5} color={colors.muted}>Price</Txt>
            <View style={styles.coinv}><Image source={img.coin} style={styles.ci} /><Txt weight={800} size={14} color={colors.tealInk}>{price}</Txt></View>
          </View>
          <View style={[styles.line, { marginBottom: 16 }]}>
            <Txt weight={600} size={13.5} color={colors.muted}>Your balance</Txt>
            <View style={styles.coinv}><Image source={img.coin} style={styles.ci} /><Txt weight={800} size={14} color={colors.tealInk}>{coins}</Txt></View>
          </View>
          <View style={styles.row}>
            <Btn title="Cancel" variant="ghost" block style={{ flex: 1 }} onPress={closeOverlay} />
            <Btn title="Buy now" block style={{ flex: 1 }} onPress={doBuy} />
          </View>
        </>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  art: { alignItems: 'center', marginBottom: 12 },
  msg: { textAlign: 'center', lineHeight: 19, marginBottom: 16 },
  line: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.cream, borderRadius: radius.sm, paddingVertical: 11, paddingHorizontal: 14, marginBottom: 8,
  },
  coinv: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  ci: { width: 18, height: 18 },
  row: { flexDirection: 'row', gap: 10, marginTop: 4 },
});
