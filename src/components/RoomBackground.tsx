import React from 'react';
import { Image } from 'react-native';
import { PET_HOME_BG } from '@/lib/assets';

/**
 * The pet's home (assets/pet/pet_home.png). The art bakes a dark picture-frame into the
 * top-LEFT corner, which collided with the coin pill and read as a clash. We shift the
 * image left (and widen it so the right stays covered) so the frame slides off the left
 * edge — the coin pill now sits on clean wall. The round window stays low-right, below
 * the shop button, so that side is untouched.
 */
export function RoomBackground() {
  return (
    <Image
      source={PET_HOME_BG}
      resizeMode="cover"
      style={{ position: 'absolute', top: 0, left: '-20%', width: '138%', height: '100%' }}
    />
  );
}
