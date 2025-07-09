import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button, TouchableOpacity } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { Map } from '../../components/Map';
import { useLocationStore } from '../../stores/locationStore';
import { useNavigation } from '@react-navigation/native';

// デフォルト地点（東京駅）
const DEFAULT_REGION: Region = {
  latitude: 35.6762,
  longitude: 139.6503,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export default function MapScreen() {
  // ========== すべてのHookを最初に宣言（条件なし） ==========
  const mapRef = useRef<MapView>(null);
  const navigation = useNavigation();
  const { location, errorMsg, isLoading } = useLocationStore();
  const refresh = useLocationStore(state => state.refresh);
  const [userInteractedRegion, setUserInteractedRegion] = useState<Region | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // region計算をメモ化
  const displayRegion = useMemo<Region>(() => {
    if (userInteractedRegion) {
      console.log('MapScreen: region決定 - ソース: user_interaction', userInteractedRegion);
      return userInteractedRegion;
    }
    
    if (location) {
      const gpsRegion = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      console.log('MapScreen: region決定 - ソース: gps', gpsRegion);
      return gpsRegion;
    }
    
    console.log('MapScreen: region決定 - ソース: default', DEFAULT_REGION);
    return DEFAULT_REGION;
  }, [location, userInteractedRegion]);

  // フォーカス時のログ出力
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('MapScreen: 画面にフォーカス');
      setUserInteractedRegion(null); // タブ切り替え時にユーザー操作をリセット
    });
    return unsubscribe;
  }, [navigation]);

  // アンフォーカス時のログ出力
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      console.log('MapScreen: 画面からフォーカスが外れる');
    });
    return unsubscribe;
  }, [navigation]);

  // 位置情報更新時のアニメーション
  useEffect(() => {
    if (!userInteractedRegion && location && mapRef.current && isMapReady) {
      console.log('MapScreen: animateToRegion呼び出し', {
        latitude: displayRegion.latitude,
        longitude: displayRegion.longitude,
      });
      
      // タイミングを少し遅らせる
      setTimeout(() => {
        mapRef.current?.animateToRegion(displayRegion, 1000);
      }, 100);
    }
  }, [location, userInteractedRegion, displayRegion, isMapReady]);

  // コールバック関数の定義
  const handleRegionChangeComplete = useCallback((region: Region) => {
    console.log('MapScreen: ユーザーが地図を操作', region);
    setUserInteractedRegion(region);
  }, []);

  const handleMapReady = useCallback(() => {
    console.log('MapScreen: MapViewの準備完了');
    setIsMapReady(true);
  }, []);

  const handleCenterOnUser = useCallback(() => {
    if (location && mapRef.current) {
      const userRegion = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      console.log('MapScreen: 現在地へセンタリング', userRegion);
      mapRef.current.animateToRegion(userRegion, 1000);
      setUserInteractedRegion(null);
    }
  }, [location]);

  // ========== レンダリング（条件分岐はJSX内で） ==========
  return (
    <View style={styles.container}>
      <Map
        ref={mapRef}
        region={displayRegion}
        showUserMarker={!!location}
        onRegionChangeComplete={handleRegionChangeComplete}
        onMapReady={handleMapReady}
      />
      
      {isLoading && !location && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}
      
      {errorMsg && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}
      
      {location && (
        <TouchableOpacity
          style={styles.centerButton}
          onPress={handleCenterOnUser}
          activeOpacity={0.7}
        >
          <Text style={styles.centerButtonText}>📍</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  errorContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.9)',
    padding: 10,
    borderRadius: 5,
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
  },
  centerButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  centerButtonText: {
    fontSize: 24,
  },
});