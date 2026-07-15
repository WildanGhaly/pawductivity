import React from 'react';
import { View } from 'react-native';
import LottieView from 'lottie-react-native';
import { petLottieSource } from '@/lib/assets';
import { moodFor } from '@/lib/companion';
import type { Species } from '@/db/types';

/**
 * Renders the companion's bundled Lottie. Clothes are NOT a static overlay — the legacy
 * ships one Lottie per (species × clothes item) with the outfit animated on the pet, so
 * an equipped `clothesId` (1..5) selects `{species}_{clothesId}.json`; no clothes → the
 * `{species}_default.json` animation. Playback speed follows mood (the rules-based MVP).
 */
export function CompanionView({
  species,
  clothesId,
  health,
  size = 220,
}: {
  species: Species;
  /** Equipped clothes item id (1..5); 0/undefined = no clothes. */
  clothesId?: number;
  health: number;
  size?: number;
}) {
  const mood = moodFor(health);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <LottieView
        source={petLottieSource(species, clothesId ?? 0)}
        autoPlay
        loop
        speed={mood.speed}
        style={{ width: size, height: size }}
        webStyle={{ width: size, height: size }}
      />
    </View>
  );
}
