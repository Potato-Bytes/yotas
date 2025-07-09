import React, { forwardRef, useState, useCallback } from 'react';
import MapView, { MapViewProps } from 'react-native-maps';

export interface MapProps extends MapViewProps {
  /** region は必須。initialRegion は禁止 */
  region: MapViewProps['region'];
  showUserMarker?: boolean;
  onSafeReady?: () => void;
}

export const Map = forwardRef<MapView, MapProps>(
  ({ region, showUserMarker = true, onSafeReady, ...rest }, ref) => {
    console.log('[Map] レンダリング時のprops', {
      region,
      hasRegion: !!region,
      regionDetails: region,
    });

    // MapView の onMapReady が呼ばれなくても onLayout は 100% 呼ばれる
    const [ready, setReady] = useState(false);

    const fireReady = useCallback(() => {
      if (!ready) {
        console.log('[Map] Map準備完了');
        setReady(true);
        onSafeReady?.();
      }
    }, [ready, onSafeReady]);

    return (
      <MapView
        ref={ref}
        style={{ flex: 1 }}
        region={region}                 // initialRegion を一切使わない
        showsUserLocation={showUserMarker}
        onMapReady={() => {
          console.log('[Map] onMapReady発火');
          fireReady();
        }}
        onLayout={() => {
          console.log('[Map] onLayout発火');
          fireReady();
        }}
        {...rest}
      />
    );
  },
);

Map.displayName = 'Map';