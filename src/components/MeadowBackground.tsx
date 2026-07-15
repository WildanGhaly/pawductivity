import React from 'react';
import { Image, View } from 'react-native';
import { MEADOW_BG } from '@/lib/assets';

/**
 * The signature backdrop: the legacy meadow scene (assets/background.png — sky, clouds,
 * grassy hill) pinned to the top, with the grass green extended below so content scrolls
 * over a continuous sunny field. This is the app's "virtual pet in a meadow" identity.
 */
export function MeadowBackground() {
  const grass = '#B7D08A'; // matches the bottom edge of background.png
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: grass }}>
      <Image source={MEADOW_BG} style={{ width: '100%', height: '62%' }} resizeMode="cover" />
    </View>
  );
}
