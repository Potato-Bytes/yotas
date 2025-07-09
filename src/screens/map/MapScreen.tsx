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

  // MapView準備完了時のアニメーション
  useEffect(() => {
    if (isMapReady && !userInteractedRegion && location && mapRef.current) {
      console.log('MapScreen: animateToRegion呼び出し（準備完了後）', displayRegion);
      setTimeout(() => {
        mapRef.current?.animateToRegion(displayRegion, 1000);
      }, 100);
    }
  }, [isMapReady, location, userInteractedRegion, displayRegion]);

  // 画面フォーカス時の再センタリング
  useFocusEffect(
    useCallback(() => {
      console.log('MapScreen: 画面にフォーカス');
      
      if (isMapReady && location && mapRef.current && !userInteractedRegion) {
        setTimeout(() => {
          mapRef.current?.animateToRegion(displayRegion, 600);
        }, 100);
      }
      
      return () => {
        console.log('MapScreen: 画面からフォーカスが外れる');
        // 画面を離れる時はユーザー操作をリセット
        setUserInteractedRegion(null);
      };
    }, [isMapReady, location, displayRegion, userInteractedRegion])
  );

  // コールバック関数
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

  // ========== レンダリング ==========
  return (
    <View style={styles.container}>
      <Map
        ref={mapRef}
        region={displayRegion}
        onMapReady={handleMapReady}
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
});