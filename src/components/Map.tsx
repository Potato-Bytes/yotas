import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { brightMapStyle } from '../constants/mapStyles';

type Props = {
  region: Region;
  onRegionChangeComplete: (newRegion: Region) => void;
  showUserMarker?: boolean;
  onMapReady?: () => void;
};

// forwardRefを使用してMapViewへの参照を外部に公開
export const Map = forwardRef<MapView, Props>(({ region, onRegionChangeComplete, showUserMarker = true, onMapReady }, ref) => {
  const mapRef = useRef<MapView>(null);

  // 外部からMapViewを制御できるようにする
  useImperativeHandle(ref, () => mapRef.current!, []);

  // デバッグログを追加
  console.log('[Map] レンダリング時のprops', {
    region,
    hasRegion: !!region,
    regionDetails: region,
  });

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      region={region}
      customMapStyle={brightMapStyle}
      onRegionChangeComplete={onRegionChangeComplete}
      onMapReady={onMapReady}
      showsUserLocation={showUserMarker}
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