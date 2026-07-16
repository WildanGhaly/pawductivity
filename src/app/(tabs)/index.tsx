import React from 'react';
import { Image, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { selectActivePet, useGame } from '@/state/stores';
import { Muted, Screen } from '@/components/ui';
import { CompanionView } from '@/components/CompanionView';
import { RoomBackground } from '@/components/RoomBackground';
import { uiIcon } from '@/lib/assets';
import { font, radius, spacing } from '@/theme';

/** White rounded pill with the coin art overlapping on the left (legacy PetNavbar). */
function CoinBadge({ amount }: { amount: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Image source={uiIcon('coin')} style={{ width: 34, height: 34, marginRight: -14, zIndex: 2 }} resizeMode="contain" />
      <View style={{ backgroundColor: '#fff', borderRadius: radius.pill, paddingVertical: 5, paddingLeft: 20, paddingRight: 14, ...shadow }}>
        <Text style={{ color: '#1E4B5F', fontSize: font.size.lg, fontFamily: font.family.bold }}>{amount}</Text>
      </View>
    </View>
  );
}

/** The legacy health bar: white pill with a yellow fill and an orange lightning badge. */
function HealthBar({ health }: { health: number }) {
  const width = 200;
  const fill = Math.max(0, Math.min(1, health / 100)) * width;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: '#fff',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: -14,
          zIndex: 2,
          ...shadow,
        }}
      >
        <Svg width={20} height={20} viewBox="0 0 24 24">
          <Path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" fill="#E28A4B" />
        </Svg>
      </View>
      <View style={{ width, height: 26, borderRadius: 13, backgroundColor: '#fff', overflow: 'hidden', justifyContent: 'center', ...shadow }}>
        <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: fill, backgroundColor: '#FFDA7C', borderRadius: 13 }} />
      </View>
    </View>
  );
}

const shadow = {
  shadowColor: '#000',
  shadowOpacity: 0.18,
  shadowRadius: 4,
  shadowOffset: { width: 0, height: 2 },
  elevation: 3,
} as const;

const nameShadow = { textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 } as const;

export default function Home() {
  const ready = useGame((s) => s.ready);
  const profile = useGame((s) => s.profile);
  const pet = useGame(selectActivePet);
  const equippedClothes = useGame((s) => s.equippedClothes);

  if (!ready || !profile) {
    return (
      <Screen scroll={false} background={<RoomBackground />}>
        <View />
      </Screen>
    );
  }

  const health = pet?.health ?? 0;

  return (
    <Screen scroll={false} background={<RoomBackground />} edges={['top']}>
      {/* Navbar: coins (left) + level (right) */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <CoinBadge amount={profile.coins} />
        <View style={{ backgroundColor: '#fff', borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: spacing.md, ...shadow }}>
          <Text style={{ color: '#1E4B5F', fontFamily: font.family.bold, fontSize: font.size.sm }}>Lv {profile.level}</Text>
        </View>
      </View>

      {pet ? (
        <>
          <View style={{ alignItems: 'center', marginTop: spacing.lg, gap: spacing.sm }}>
            <Text style={{ color: '#fff', fontSize: 26, fontFamily: font.family.bold, ...nameShadow }}>{pet.name}</Text>
            <HealthBar health={health} />
          </View>

          {/* Pet standing on the floor (the hero — big, like the legacy) */}
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '8%' }}>
            <CompanionView species={pet.species} clothesId={equippedClothes[0]?.id} health={health} size={340} />
          </View>
        </>
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Muted style={{ color: '#fff' }}>No companion yet.</Muted>
        </View>
      )}
    </Screen>
  );
}
