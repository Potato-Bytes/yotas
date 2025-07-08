import React from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { brightMapStyle } from '../constants/mapStyles';

type Props = {
  region: Region;
  onRegionChangeComplete: (newRegion: Region) => void;
};

export function Map({ region, onRegionChangeComplete }: Props) {
  // 有効なregionデータかチェック
  if (!region || !region.latitude || !region.longitude) {
    console.warn('Map: 無効なregionデータ', region);
    return null;
  }

  return (
    <MapView
      style={styles.map}
      region={region}
      customMapStyle={brightMapStyle}
      onRegionChangeComplete={onRegionChangeComplete}
      showsUserLocation={true}
      showsMyLocationButton={false}
      loadingEnabled={true}
      loadingIndicatorColor="#0000ff"
      loadingBackgroundColor="rgba(255, 255, 255, 0.8)"
    />
  );
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%',
  },
});