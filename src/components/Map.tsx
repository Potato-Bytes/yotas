import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import MapView, { MapViewProps, PROVIDER_GOOGLE } from 'react-native-maps';
import { StyleSheet } from 'react-native';

interface MapProps extends MapViewProps {
  showUserMarker?: boolean;
}

export const Map = forwardRef<MapView, MapProps>((props, ref) => {
  const mapRef = useRef<MapView>(null);
  const { region, showUserMarker = false, onMapReady, ...restProps } = props;

  useImperativeHandle(ref, () => mapRef.current!, []);

  // デバッグログ
  console.log('[Map] レンダリング時のprops', {
    region,
    hasRegion: !!region,
    regionDetails: region,
  });

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      provider={PROVIDER_GOOGLE}
      region={region}
      showsUserLocation={showUserMarker}
      showsMyLocationButton={false}
      followsUserLocation={false}
      onMapReady={() => {
        console.log('[Map] MapView is ready');
        onMapReady?.();
      }}
      {...restProps}
    />
  );
});

Map.displayName = 'Map';

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});