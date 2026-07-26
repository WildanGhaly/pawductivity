import React from 'react';
import { Image, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { lottiePet, speciesThumb } from '../assets/registry';
import { Species } from '../domain/types';
import { clothesKey } from '../domain/mechanics';
import { PetSprite, isSpriteSpecies } from './PetSprite';

// Native: render the Lottie companion animation (mood-based speed), keyed by
// species + worn clothes. Web uses PetView.web.tsx (thumbnail). See SPEC D7.
export function PetView({
  species,
  clothesId,
  size = 210,
  speed = 1,
}: {
  species: Species;
  clothesId: number;
  size?: number;
  speed?: number;
}) {
  // New companions are hand-drawn animated SVG sprites, not Lottie.
  if (isSpriteSpecies(species)) {
    return <PetSprite species={species} clothesId={clothesId} size={size} speed={speed} />;
  }
  const key = clothesKey({ clothesId } as any);
  const source = lottiePet[species]?.[key] || lottiePet[species]?.default;
  if (!source) {
    return (
      <Image
        source={speciesThumb[species]}
        style={{ width: size * 0.7, height: size * 0.85, alignSelf: 'center' }}
        resizeMode="contain"
      />
    );
  }
  return (
    <View style={{ width: size, height: size * 1.15, alignSelf: 'center' }}>
      <LottieView autoPlay loop speed={speed} source={source} style={{ width: '100%', height: '100%' }} />
    </View>
  );
}
