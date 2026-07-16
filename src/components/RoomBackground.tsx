import React from 'react';
import { Image } from 'react-native';
import { PET_HOME_BG } from '@/lib/assets';

/**
 * The pet's home (assets/pet/pet_home.png), full-bleed cover. Anchored a little low so the
 * top of the screen is plain wall for the coin/level pills (rather than the window frame),
 * and the floor sits near the bottom where the companion stands.
 */
export function RoomBackground() {
  return (
    <Image
      source={PET_HOME_BG}
      resizeMode="cover"
      style={{ position: 'absolute', top: '-14%', left: 0, right: 0, width: '100%', height: '114%' }}
    />
  );
}
