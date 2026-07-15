import React from 'react';
import { Image, View } from 'react-native';
import { MEADOW_BG } from '@/lib/assets';
import { useTheme } from '@/theme';

/**
 * The signature backdrop: the legacy meadow scene (sky + clouds + grassy hill) pinned to
 * the top, with the grass green extended below it so content scrolls over a continuous
 * field. This is what gives the app its warm "virtual pet in a sunny meadow" identity.
 */
export function MeadowBackground({ dim = false }: { dim?: boolean }) {
  const { scheme } = useTheme();
  const grass = '#B7D08A'; // matches the bottom edge of background.png
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: grass }}>
      <Image source={MEADOW_BG} style={{ width: '100%', height: '62%' }} resizeMode="cover" />
      {scheme === 'dark' || dim ? (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(7,26,34,0.55)' }} />
      ) : null}
    </View>
  );
}
