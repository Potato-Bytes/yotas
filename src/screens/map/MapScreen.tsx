import React, {
  useRef,
  useState,
  useMemo,
  useEffect,
  useCallback,
} from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { useFocusEffect } from '@react-navigation/native';
import { Map } from '../../components/Map';
import { useLocationStore } from '../../stores/locationStore';

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
  const { location, errorMsg, isLoading } = useLocationStore();
  
  /** region を完全にこの state だけで管理 */
  const [region, setRegion] = useState<Region | null>(null);
  const [mapReady, setMapReady] = useState(false);

  /** ① 位置情報が来たら一度だけ region を決定 */
  useEffect(() => {
    if (!region && location) {
      const initialRegion = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      console.log('MapScreen: 初期region設定', initialRegion);
      setRegion(initialRegion);
    }
  }, [location, region]);

  // centerOnUser関数（region更新込み）
  const centerOnUser = useCallback(() => {
    if (!location || !mapReady) {
      console.log('MapScreen: centerOnUser条件未満 - location:', !!location, 'mapReady:', mapReady);
      return;
    }
    const userRegion = {
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    console.log('MapScreen: 現在地へセンタリング', userRegion);
    mapRef.current?.animateToRegion(userRegion, 500);
    setRegion(userRegion); // ★ props も同じ値に
  }, [location, mapReady]);

  // 画面フォーカス時の復元
  useFocusEffect(
    useCallback(() => {
      // 画面復帰時
      if (region) {
        console.log('MapScreen: 画面復帰 - 最後のregionで復元', region);
        mapRef.current?.animateToRegion(region, 0);
      } else {
        console.log('MapScreen: 画面復帰 - 現在地にセンタリング');
        centerOnUser();
      }
      return () => {}; // cleanup 特になし
    }, [region, centerOnUser]),
  );

  // コールバック関数
  const handleRegionChangeComplete = useCallback((r: Region) => {
    console.log('MapScreen: ユーザーが地図を操作', r);
    setRegion(r); // ★ ユーザ操作を常に保存
  }, []);

  const handleMapReady = useCallback(() => {
    console.log('MapScreen: MapViewの準備完了');
    setMapReady(true);
  }, []);

  // ========== レンダリング ==========
  console.log('MapScreen: レンダリング状態', { region, location, isLoading, errorMsg });
  
  return (
    <View style={styles.container}>
      {/* デバッグ情報 */}
      <View style={styles.debugInfo}>
        <Text>region: {region ? 'あり' : 'なし'}</Text>
        <Text>location: {location ? 'あり' : 'なし'}</Text>
        <Text>isLoading: {isLoading ? 'true' : 'false'}</Text>
        <Text>errorMsg: {errorMsg || 'なし'}</Text>
      </View>
      
      {/* 一時的に無条件でMapを表示 */}
      <Map
        ref={mapRef}
        region={region || DEFAULT_REGION}
        onSafeReady={handleMapReady}
        showUserMarker={!!location}
        onRegionChangeComplete={handleRegionChangeComplete}
      />
      
      {isLoading && !location && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>現在地を取得中...</Text>
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
          onPress={centerOnUser}
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
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
  debugInfo: {
    position: 'absolute',
    top: 50,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 5,
    zIndex: 1000,
  },
});