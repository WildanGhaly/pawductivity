import React from 'react';
import { Image } from 'react-native';
import { speciesThumb } from '../assets/registry';
import { Species } from '../domain/types';
import { PetSprite, isSpriteSpecies } from './PetSprite';

// Web (verification only): render the species thumbnail. Never imports
// lottie-react-native, whose web build pulls an uninstalled dep. See SPEC D7.
export function PetView({
  species,
  clothesId,
  size = 210,
}: {
  species: Species;
  clothesId: number;
  size?: number;
  speed?: number;
}) {
  if (isSpriteSpecies(species)) {
    return <PetSprite species={species} clothesId={clothesId} size={size} />;
  }
  return (
    <Image
      source={speciesThumb[species]}
      style={{ width: size * 0.7, height: size * 0.85, alignSelf: 'center' }}
      resizeMode="contain"
    />
  );
}
