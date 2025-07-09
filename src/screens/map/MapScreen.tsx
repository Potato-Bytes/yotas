import React, {
  useRef,
  useState,
  useMemo,
  useEffect,
  useCallback,
} from 'react-native';
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
  const locationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isComponentMounted = useRef(true);
  const { location, errorMsg, isLoading } = useLocationStore();
  
  /** region を完全にこの state だけで管理 */
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapLayoutComplete, setMapLayoutComplete] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  /** ① 位置情報が来たら一度だけ region を決定 */
  useEffect(() => {
    if (location && isComponentMounted.current) {
      const initialRegion = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      console.log('MapScreen: 初期region設定', initialRegion);
      setRegion(initialRegion);
      setLocationError(null);
    }
  }, [location]);

  /** ② 位置情報取得のタイムアウト処理 */
  useEffect(() => {
    if (isLoading && !location) {
      locationTimeoutRef.current = setTimeout(() => {
        if (isComponentMounted.current && isLoading) {
          setLocationError('位置情報の取得がタイムアウトしました');
        }
      }, 30000);
    }

    return () => {
      if (locationTimeoutRef.current) {
        clearTimeout(locationTimeoutRef.current);
      }
    };
  }, [isLoading, location]);

  /** ③ コンポーネントのクリーンアップ */
  useEffect(() => {
    return () => {
      isComponentMounted.current = false;
      if (locationTimeoutRef.current) {
        clearTimeout(locationTimeoutRef.current);
      }
    };
  }, []);

  // centerOnUser関数（region更新込み）
  const centerOnUser = useCallback(() => {
    if (!location || !isMapReady) {
      console.log('MapScreen: centerOnUser条件未満 - location:', !!location, 'mapReady:', isMapReady);
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
  }, [location, isMapReady]);

  // onLayout Fallbackの実装
  const handleMapLayout = useCallback(() => {
    setMapLayoutComplete(true);
    // onMapReadyが呼ばれない場合の対策
    if (!isMapReady) {
      setTimeout(() => {
        if (isComponentMounted.current) {
          setIsMapReady(true);
        }
      }, 500);
    }
  }, [isMapReady]);

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
    if (isComponentMounted.current) {
      setIsMapReady(true);
    }
  }, []);

  // ========== レンダリング ==========
  console.log('MapScreen: レンダリング状態', { region, location, isLoading, errorMsg, locationError });
  
  return (
    <View style={styles.container}>
      {/* デバッグ情報 */}
      <View style={styles.debugInfo}>
        <Text>Map Ready: {isMapReady ? 'true' : 'false'}</Text>
        <Text>Map Layout: {mapLayoutComplete ? 'true' : 'false'}</Text>
        <Text>Location: {location ? 'あり' : 'なし'}</Text>
        <Text>Permission: {errorMsg || 'OK'}</Text>
        <Text>Region: {region ? `${region.latitude.toFixed(4)},${region.longitude.toFixed(4)}` : 'なし'}</Text>
      </View>
      
      {/* 常にMapViewをレンダリング */}
      <Map
        ref={mapRef}
        initialRegion={DEFAULT_REGION}
        region={region}
        onSafeReady={handleMapReady}
        onLayout={handleMapLayout}
        showUserMarker={!!location}
        onRegionChangeComplete={handleRegionChangeComplete}
      />
      
      {isLoading && !location && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>現在地を取得中...</Text>
        </View>
      )}
      
      {(errorMsg || locationError) && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMsg || locationError}</Text>
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