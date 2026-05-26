import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View } from 'react-native';

type Props = {
  uri: string | null | undefined;
};

/** Marca d'água de fundo — igual ao web (opacity ~10%, cover central). */
export function CardWatermark({ uri }: Props) {
  if (!uri) return null;

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Image source={{ uri }} style={styles.image} contentFit="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
    zIndex: 0,
    overflow: 'hidden',
    borderRadius: 16,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
