import React from 'react';
import { Image } from 'react-native';
import { PET_HOME_BG } from '@/lib/assets';

/**
 * The pet's home: the legacy room scene (assets/pet/pet_home.png), used as the full-bleed
 * backdrop on the Home tab exactly like the legacy pet_home.dart (DecorationImage, cover).
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
