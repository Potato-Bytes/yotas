import React, { memo, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { brightMapStyle } from '../constants/mapStyles';

type Props = {
  region: Region;
  onRegionChangeComplete: (newRegion: Region) => void;
};

// 重要: React.memoで不要な再レンダリングを防止
export const Map = memo(({ region, onRegionChangeComplete }: Props) => {
  console.log('Map: レンダリング', { region });
  
  // 重要: コールバックのメモ化（フックは早期リターンの前に置く）
  const handleRegionChangeComplete = useCallback((newRegion: Region) => {
    // MapViewの内部バグによる同一値での呼び出しを防ぐ
    if (region.latitude !== newRegion.latitude || 
        region.longitude !== newRegion.longitude) {
      onRegionChangeComplete(newRegion);
    }
  }, [region, onRegionChangeComplete]);
  
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
      onRegionChangeComplete={handleRegionChangeComplete}
      showsUserLocation={true}
      showsMyLocationButton={false}
      followsUserLocation={false}
      rotateEnabled={true}
      pitchEnabled={true}
      scrollEnabled={true}
      zoomEnabled={true}
      // 重要: アニメーションを無効化して再レンダリングを減らす
      moveOnMarkerPress={false}
      loadingEnabled={true}
      loadingIndicatorColor="#0000ff"
      loadingBackgroundColor="rgba(255, 255, 255, 0.8)"
    />
  );
}, (prevProps, nextProps) => 
  // カスタム比較関数: regionが実質的に変更された場合のみ再レンダリング
   (
    prevProps.region.latitude === nextProps.region.latitude &&
    prevProps.region.longitude === nextProps.region.longitude &&
    prevProps.region.latitudeDelta === nextProps.region.latitudeDelta &&
    prevProps.region.longitudeDelta === nextProps.region.longitudeDelta
  )
);

Map.displayName = 'Map';

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%',
  },
});