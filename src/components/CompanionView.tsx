import React from 'react';
import { View } from 'react-native';
import LottieView from 'lottie-react-native';
import { petLottieSource } from '@/lib/assets';
import { moodFor } from '@/lib/companion';
import type { Species } from '@/db/types';

/**
 * Renders the companion's bundled Lottie for its species + evolution stage,
 * with playback speed driven by mood (the rules-based MVP director).
 */
export function CompanionView({
  species,
  stage,
  health,
  size = 220,
}: {
  species: Species;
  stage: number;
  health: number;
  size?: number;
}) {
  const mood = moodFor(health);
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', height: size }}>
      <LottieView
        source={petLottieSource(species, stage)}
        autoPlay
        loop
        speed={mood.speed}
        style={{ width: size, height: size }}
        webStyle={{ width: size, height: size }}
      />
    </View>
  );
}
