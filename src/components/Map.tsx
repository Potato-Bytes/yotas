import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { brightMapStyle } from '../constants/mapStyles';

type Props = {
  region: Region;
  onRegionChangeComplete: (newRegion: Region) => void;
};

// 厳密な比較でメモ化
export const Map = memo(({ region, onRegionChangeComplete }: Props) => {
  // デバッグ用ログを削減（パフォーマンス向上）
  // console.log('Map: レンダリング', { region });
  
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
      followsUserLocation={false}
      rotateEnabled={true}
      pitchEnabled={true}
      scrollEnabled={true}
      zoomEnabled={true}
      moveOnMarkerPress={false}
      loadingEnabled={true}
      loadingIndicatorColor="#0000ff"
      loadingBackgroundColor="rgba(255, 255, 255, 0.8)"
    />
  );
}, (prevProps, nextProps) => {
  // 完全に同一の場合のみ再レンダリングをスキップ
  return (
    prevProps.region.latitude === nextProps.region.latitude &&
    prevProps.region.longitude === nextProps.region.longitude &&
    prevProps.region.latitudeDelta === nextProps.region.latitudeDelta &&
    prevProps.region.longitudeDelta === nextProps.region.longitudeDelta &&
    prevProps.onRegionChangeComplete === nextProps.onRegionChangeComplete
  );
});

Map.displayName = 'Map';

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%',
  },
});