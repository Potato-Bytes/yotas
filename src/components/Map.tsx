import React from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { brightMapStyle } from '../constants/mapStyles';

type Props = {
  region: Region;
  onRegionChangeComplete: (newRegion: Region) => void;
};

export function Map({ region, onRegionChangeComplete }: Props) {
  return (
    <MapView
      style={styles.map}
      region={region}
      customMapStyle={brightMapStyle}
      onRegionChangeComplete={onRegionChangeComplete}
    />
  );
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%',
  },
});