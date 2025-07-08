import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { brightMapStyle } from '../constants/mapStyles';

type Props = {
  region: Region;
  onRegionChangeComplete: (newRegion: Region) => void;
};

// シンプルなメモ化
export const Map = memo(({ region, onRegionChangeComplete }: Props) => {
  return (
    <MapView
      style={styles.map}
      region={region}
      customMapStyle={brightMapStyle}
      onRegionChangeComplete={onRegionChangeComplete}
      showsUserLocation={true}
      showsMyLocationButton={false}
      followsUserLocation={false}
      // 以下のプロパティは必要最小限に
      rotateEnabled={true}
      scrollEnabled={true}
      zoomEnabled={true}
    />
  );
});

Map.displayName = 'Map';

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%',
  },
});