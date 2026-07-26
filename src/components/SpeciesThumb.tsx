import React from 'react';
import { Image } from 'react-native';
import { speciesThumb } from '../assets/registry';
import { Species } from '../domain/types';
import { PetSprite, isSpriteSpecies } from './PetSprite';

// A species thumbnail for the shop / buy dialog: the bundled PNG for the Lottie
// starters, or the hand-drawn SVG sprite (static by default) for the new companions.
export function SpeciesThumb({
  species,
  size = 78,
  animated = false,
}: {
  species: Species;
  size?: number;
  animated?: boolean;
}) {
  if (isSpriteSpecies(species)) {
    return <PetSprite species={species} size={size} animated={animated} />;
  }
  return <Image source={speciesThumb[species]} style={{ width: size, height: size }} resizeMode="contain" />;
}
