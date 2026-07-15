import React from 'react';
import { Alert, Image, View } from 'react-native';
import { selectActivePet, useEntitlement, useGame } from '@/state/stores';
import { Body, Button, Card, CoinPill, Heading, Muted, Pill, Screen } from '@/components/ui';
import { foodImage } from '@/lib/assets';
import { spacing } from '@/theme';

export default function Shop() {
  const food = useGame((s) => s.food);
  const coins = useGame((s) => s.profile?.coins ?? 0);
  const buy = useGame((s) => s.buy);
  const feed = useGame((s) => s.feed);
  const pet = useGame(selectActivePet);
  const isPremium = useEntitlement((s) => s.isPremium);

  function onBuy(id: number) {
    try {
      buy(id);
    } catch (e: any) {
      Alert.alert('Cannot buy', e?.message ?? 'Purchase failed');
    }
  }

  function onFeed(id: number) {
    try {
      const health = feed(id);
      Alert.alert('Yum! 🍽️', `${pet?.name ?? 'Your companion'} is now at ${health}/100 health.`);
    } catch (e: any) {
      Alert.alert('Cannot feed', e?.message ?? 'Feeding failed');
    }
  }

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Heading>Shop</Heading>
        <CoinPill amount={coins} />
      </View>
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
              <Button label="Buy" variant="ghost" onPress={() => onBuy(f.id)} style={{ paddingVertical: 8 }} />
              <Button
                label="Feed"
                variant="accent"
                disabled={f.quantity <= 0}
                onPress={() => onFeed(f.id)}
                style={{ paddingVertical: 8 }}
              />
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}
