import React from 'react';
import { Image } from 'react-native';
import { MEADOW_BG } from '@/lib/assets';

/**
 * The meadow scene (assets/background.png) as a single full-bleed cover image — exactly
 * like the legacy TaskTimerBackgroundImage (BoxFit.cover). One image, no solid-fill band,
 * so there is never a seam across the screen.
 */
export function MeadowBackground() {
  return (
    <Image
      source={MEADOW_BG}
      resizeMode="cover"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
    />
  );
}
