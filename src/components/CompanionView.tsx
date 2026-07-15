import React from 'react';
import { Image, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { clothesImage, petLottieSource } from '@/lib/assets';
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
  clothesKey,
}: {
  species: Species;
  stage: number;
  health: number;
  size?: number;
  clothesKey?: string;
}) {
  const mood = moodFor(health);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <LottieView
        source={petLottieSource(species, stage)}
        autoPlay
        loop
        speed={mood.speed}
        style={{ width: size, height: size }}
        webStyle={{ width: size, height: size }}
      />
      {clothesKey ? (
        <Image
          source={clothesImage(clothesKey)}
          resizeMode="contain"
          style={{ position: 'absolute', width: size * 0.5, height: size * 0.42, top: size * 0.46, left: size * 0.25 }}
        />
      ) : null}
    </View>
  );
}
