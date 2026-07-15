import React, { useState } from 'react';
import { Alert, Image, Pressable, View } from 'react-native';
import * as repo from '@/db/repo';
import { selectActivePet, useEntitlement, useGame } from '@/state/stores';
import { Body, Button, Card, CoinPill, Heading, Muted, Pill, Screen } from '@/components/ui';
import { clothesImage, foodImage, petImage } from '@/lib/assets';
import { radius, spacing, useTheme } from '@/theme';

type Section = 'food' | 'pets' | 'wardrobe';

export default function Shop() {
  const { colors } = useTheme();
  const [section, setSection] = useState<Section>('food');

  const coins = useGame((s) => s.profile?.coins ?? 0);
  const food = useGame((s) => s.food);
  const pets = useGame((s) => s.pets); // re-render trigger on adopt/switch
  const activePetId = useGame((s) => s.activePetId);
  const buy = useGame((s) => s.buy);
  const feed = useGame((s) => s.feed);
  const adopt = useGame((s) => s.adopt);
  const buyClothes = useGame((s) => s.buyClothes);
  const equip = useGame((s) => s.equip);
  const setActivePet = useGame((s) => s.setActivePet);
  const pet = useGame(selectActivePet);
  const isPremium = useEntitlement((s) => s.isPremium);

  function guard(fn: () => void, title: string) {
    try {
      fn();
    } catch (e: any) {
      Alert.alert(title, e?.message ?? 'Action failed');
    }
  }

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Heading>Shop</Heading>
        <CoinPill amount={coins} />
      </View>

      {/* segmented control */}
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {(['food', 'pets', 'wardrobe'] as Section[]).map((s) => {
          const active = section === s;
          const label = s === 'food' ? 'Food' : s === 'pets' ? 'Companions' : 'Wardrobe';
          return (
            <Pressable
              key={s}
              onPress={() => setSection(s)}
              style={{
                flex: 1,
                paddingVertical: spacing.sm,
                borderRadius: radius.md,
                alignItems: 'center',
                backgroundColor: active ? colors.primary : colors.cardAlt,
              }}
            >
              <Body style={{ color: active ? colors.onPrimary : colors.textMuted, fontWeight: '600' }}>{label}</Body>
            </Pressable>
          );
        })}
      </View>

      {section === 'food' ? (
        <>
          <Muted>Buy food and feed your companion to restore Health.</Muted>
          {food.map((f) => {
            const locked = !!f.premium && !isPremium;
            return (
              <Card key={f.id} style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
                <Image source={foodImage(f.asset)} style={{ width: 46, height: 46 }} resizeMode="contain" />
                <View style={{ flex: 1, gap: 4 }}>
                  <Body style={{ fontWeight: '600' }}>
                    {f.name} {f.premium ? '⭐' : ''}
                  </Body>
                  <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Muted>{f.price} 🪙</Muted>
                    <Muted>· +{f.heal} health</Muted>
                    {f.quantity > 0 ? <Pill label={`owned x${f.quantity}`} /> : null}
                    {locked ? <Pill label="Premium" /> : null}
                  </View>
                </View>
                <View style={{ gap: 6, width: 84 }}>
                  <Button label="Buy" variant="ghost" onPress={() => guard(() => buy(f.id), 'Cannot buy')} style={{ paddingVertical: 8 }} />
                  <Button
                    label="Feed"
                    variant="accent"
                    disabled={f.quantity <= 0}
                    onPress={() =>
                      guard(() => {
                        const h = feed(f.id);
                        Alert.alert('Yum! 🍽️', `${pet?.name ?? 'Your companion'} is now at ${h}/100 health.`);
                      }, 'Cannot feed')
                    }
                    style={{ paddingVertical: 8 }}
                  />
                </View>
              </Card>
            );
          })}
        </>
      ) : null}

      {section === 'pets' ? (
        <>
          <Muted>Adopt new companions and switch who’s active.</Muted>
          {repo.listAnimalsWithOwnership().map((a) => {
            const active = a.owned && a.petId === activePetId;
            const locked = !!a.premium && !isPremium;
            return (
              <Card key={a.id} style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
                <Image source={petImage(a.species)} style={{ width: 46, height: 46 }} resizeMode="contain" />
                <View style={{ flex: 1, gap: 4 }}>
                  <Body style={{ fontWeight: '600' }}>
                    {a.name} {a.premium ? '⭐' : ''}
                  </Body>
                  <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Muted>{a.owned ? 'Owned' : `${a.price} 🪙`}</Muted>
                    {locked && !a.owned ? <Pill label="Premium" /> : null}
                  </View>
                </View>
                {active ? (
                  <Pill label="Active" color={colors.primary} textColor={colors.onPrimary} />
                ) : a.owned ? (
                  <Button label="Switch" variant="ghost" onPress={() => setActivePet(a.petId!)} style={{ paddingVertical: 8, width: 90 }} />
                ) : (
                  <Button
                    label="Adopt"
                    onPress={() => guard(() => adopt(a.id), 'Cannot adopt')}
                    style={{ paddingVertical: 8, width: 90 }}
                  />
                )}
              </Card>
            );
          })}
        </>
      ) : null}

      {section === 'wardrobe' ? (
        <>
          <Muted>Buy outfits and dress {pet?.name ?? 'your companion'}.</Muted>
          {repo.listClothesWithState(activePetId).map((c) => {
            const locked = !!c.premium && !isPremium;
            return (
              <Card key={c.id} style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
                <Image source={clothesImage(c.asset)} style={{ width: 46, height: 46 }} resizeMode="contain" />
                <View style={{ flex: 1, gap: 4 }}>
                  <Body style={{ fontWeight: '600' }}>
                    {c.name} {c.premium ? '⭐' : ''}
                  </Body>
                  <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Muted>{c.owned ? 'Owned' : `${c.price} 🪙`}</Muted>
                    {locked && !c.owned ? <Pill label="Premium" /> : null}
                  </View>
                </View>
                {!c.owned ? (
                  <Button label="Buy" variant="ghost" onPress={() => guard(() => buyClothes(c.id), 'Cannot buy')} style={{ paddingVertical: 8, width: 90 }} />
                ) : (
                  <Button
                    label={c.equipped ? 'Equipped ✓' : 'Equip'}
                    variant={c.equipped ? 'primary' : 'accent'}
                    onPress={() => guard(() => equip(c.id), 'Cannot equip')}
                    style={{ paddingVertical: 8, width: 90 }}
                  />
                )}
              </Card>
            );
          })}
          <Muted style={{ textAlign: 'center' }}>Tap an equipped item to remove it.</Muted>
        </>
      ) : null}
    </Screen>
  );
}
