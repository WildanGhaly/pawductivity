import React from 'react';
import { Image } from 'react-native';
import { PET_HOME_BG } from '@/lib/assets';

/**
 * The pet's home (assets/pet/pet_home.png), full-bleed cover — exactly the legacy
 * `BoxFit.cover` (pet_home.dart). The picture-frame corner and round window are part of
 * the artwork and sit in the corners by design; the coin pill / shop button clear them.
 */
export function RoomBackground() {
  return (
    <Image
      source={PET_HOME_BG}
      resizeMode="cover"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
    />
  );
}
