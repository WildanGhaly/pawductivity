import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Image } from 'react-native';
import { colors, radius, shadow } from '../theme/tokens';
import { Txt, CoinPill } from '../components/ui';
import { Icon } from '../components/Icon';
import { OverlayScreen } from '../components/OverlayScreen';
import { useStore } from '../store/store';
import { FOODS, CLOTHES, SPECIES } from '../domain/catalogs';
import { img, foodImg, clothesImg, speciesThumb } from '../assets/registry';

type ShopTab = 'food' | 'pets' | 'clothes';

const TABS: { key: ShopTab; label: string; icon: any }[] = [
  { key: 'food', label: 'Food', icon: img.food },
  { key: 'pets', label: 'Companions', icon: img.petIcon },
  { key: 'clothes', label: 'Wardrobe', icon: img.wardrobe },
];

// The prototype's buy button has several looks. The store buy actions already run
// the premium and coin checks (and emit the toast), so each button just calls the
// matching action; owned outfits call equip instead.
type BtnSpec =
  | { kind: 'buy'; price: number; onPress: () => void }
  | { kind: 'prem'; onPress: () => void }
  | { kind: 'owned'; label: string }
  | { kind: 'equipped'; onPress: () => void }
  | { kind: 'equip'; onPress: () => void };

export function ShopScreen({ param }: { param?: { tab?: ShopTab } }) {
  const s = useStore((st) => st.state)!;
  const buyFood = useStore((st) => st.buyFood);
  const buyPet = useStore((st) => st.buyPet);
  const buyClothes = useStore((st) => st.buyClothes);
  const equip = useStore((st) => st.equip);

  const [tab, setTab] = useState<ShopTab>(param?.tab || 'food');

  const cards: React.ReactNode[] = [];
  if (tab === 'food') {
    FOODS.forEach((f) => {
      const qty = s.pet.food[f.id] || 0;
      const locked = f.premium && !s.profile.premium;
      cards.push(
        <ShopCard
          key={f.id}
          art={foodImg[f.id]}
          name={f.name}
          desc={`+${f.heal} health`}
          locked={locked}
          qty={qty > 0 ? qty : undefined}
          button={locked ? { kind: 'prem', onPress: () => buyFood(f.id) } : { kind: 'buy', price: f.price, onPress: () => buyFood(f.id) }}
        />
      );
    });
  } else if (tab === 'pets') {
    SPECIES.forEach((sp) => {
      const owned = sp.key === s.pet.species;
      const locked = sp.premium && !s.profile.premium;
      let button: BtnSpec;
      if (owned) button = { kind: 'owned', label: 'Adopted' };
      else if (locked) button = { kind: 'prem', onPress: () => buyPet(sp.id) };
      else button = { kind: 'buy', price: sp.price, onPress: () => buyPet(sp.id) };
      cards.push(
        <ShopCard
          key={sp.id}
          art={speciesThumb[sp.key]}
          name={sp.name}
          desc={sp.premium ? 'Premium' : 'Companion'}
          locked={locked}
          button={button}
        />
      );
    });
  } else {
    CLOTHES.forEach((c) => {
      const owned = s.pet.ownedClothes.includes(c.id);
      const on = s.pet.clothesId === c.id;
      const locked = c.premium && !s.profile.premium;
      let button: BtnSpec;
      if (owned) button = on ? { kind: 'equipped', onPress: () => equip(c.id) } : { kind: 'equip', onPress: () => equip(c.id) };
      else if (locked) button = { kind: 'prem', onPress: () => buyClothes(c.id) };
      else button = { kind: 'buy', price: c.price, onPress: () => buyClothes(c.id) };
      cards.push(
        <ShopCard
          key={c.id}
          art={clothesImg[c.id]}
          name={c.name}
          desc="Cosmetic"
          locked={locked}
          button={button}
        />
      );
    });
  }

  return (
    <OverlayScreen title="Shop" right={<CoinPill amount={s.profile.coins} />}>
      <View style={styles.segtabs}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <Pressable key={t.key} style={[styles.seg, active && styles.segOn]} onPress={() => setTab(t.key)}>
              <Image source={t.icon} style={[styles.segImg, active && { opacity: 1 }]} resizeMode="contain" />
              <Txt weight={700} size={12} color={active ? colors.orange2 : colors.muted}>{t.label}</Txt>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.grid}>{cards}</View>
    </OverlayScreen>
  );
}

function ShopCard({
  art,
  name,
  desc,
  locked,
  qty,
  button,
}: {
  art: any;
  name: string;
  desc: string;
  locked?: boolean;
  qty?: number;
  button: BtnSpec;
}) {
  return (
    <View style={styles.shopcard}>
      {locked && (
        <View style={styles.prembadge}>
          <Icon name="crown" size={11} color="#7A4B00" />
          <Txt weight={800} size={9.5} color="#7A4B00">Premium</Txt>
        </View>
      )}
      {qty != null && (
        <View style={styles.qty}>
          <Txt weight={800} size={11} color={colors.teal}>×{qty}</Txt>
        </View>
      )}
      <Image source={art} style={styles.art} resizeMode="contain" />
      <Txt weight={700} size={13.5} color={colors.tealInk}>{name}</Txt>
      <Txt weight={600} size={11} color={colors.muted} style={styles.cd}>{desc}</Txt>
      <BuyButton spec={button} />
    </View>
  );
}

function BuyButton({ spec }: { spec: BtnSpec }) {
  let face: string;
  let shade: string | null;
  let content: React.ReactNode;
  let border = false;

  if (spec.kind === 'buy') {
    face = colors.orange;
    shade = colors.orange2;
    content = (
      <>
        <Image source={img.coin} style={styles.buyCoin} />
        <Txt weight={800} size={13.5} color="#fff">{spec.price}</Txt>
      </>
    );
  } else if (spec.kind === 'prem') {
    face = colors.yellow;
    shade = '#D9A93C';
    content = (
      <>
        <Icon name="crown" size={13} color="#7A4B00" />
        <Txt weight={800} size={13.5} color="#7A4B00">Unlock</Txt>
      </>
    );
  } else if (spec.kind === 'owned') {
    face = '#E4EFF3';
    shade = null;
    content = (
      <>
        <Icon name="check" size={13} color={colors.good} strokeWidth={3} />
        <Txt weight={800} size={13.5} color={colors.good}>{spec.label}</Txt>
      </>
    );
  } else if (spec.kind === 'equipped') {
    face = colors.teal;
    shade = '#072f3d';
    content = (
      <>
        <Icon name="check" size={13} color="#fff" strokeWidth={3} />
        <Txt weight={800} size={13.5} color="#fff">Wearing</Txt>
      </>
    );
  } else {
    face = '#fff';
    shade = null;
    border = true;
    content = <Txt weight={800} size={13.5} color={colors.teal}>Wear</Txt>;
  }

  const onPress = 'onPress' in spec ? spec.onPress : undefined;
  const lip = shade ? 4 : 0;

  return (
    <Pressable disabled={!onPress} onPress={onPress} style={styles.buyWrap}>
      {({ pressed }) => (
        <View style={{ borderRadius: 12, backgroundColor: shade || 'transparent', paddingBottom: lip }}>
          <View
            style={[
              styles.buyFace,
              {
                backgroundColor: face,
                borderWidth: border ? 1.5 : 0,
                borderColor: colors.line2,
                transform: [{ translateY: pressed && lip ? lip - 2 : 0 }],
              },
            ]}
          >
            {content}
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  segtabs: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  seg: {
    flex: 1, alignItems: 'center', gap: 4, paddingVertical: 9, paddingHorizontal: 4,
    borderRadius: 14, borderWidth: 1.5, borderColor: 'transparent',
  },
  segOn: { backgroundColor: '#FFF7EF', borderColor: '#F6DFC4' },
  segImg: { width: 26, height: 26, opacity: 0.55 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  shopcard: {
    width: '47%', flexGrow: 1, backgroundColor: '#fff', borderRadius: 18, padding: 12,
    borderWidth: 1, borderColor: colors.line, alignItems: 'center', overflow: 'hidden', ...shadow.sm,
  },
  art: { width: 78, height: 78, marginTop: 6, marginBottom: 8 },
  cd: { marginTop: 2, minHeight: 15, textAlign: 'center' },
  prembadge: {
    position: 'absolute', top: 8, right: 8, zIndex: 2, flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.yellow, paddingVertical: 4, paddingHorizontal: 9, borderRadius: radius.pill, ...shadow.sm,
  },
  qty: {
    position: 'absolute', top: 8, left: 8, zIndex: 2, backgroundColor: colors.cream,
    borderWidth: 1, borderColor: colors.line2, paddingVertical: 2, paddingHorizontal: 8, borderRadius: radius.pill,
  },
  buyWrap: { width: '100%', marginTop: 10 },
  buyFace: {
    borderRadius: 12, paddingVertical: 9, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 5,
  },
  buyCoin: { width: 17, height: 17 },
});
