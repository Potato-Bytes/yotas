// src/screens/map/MapScreen.tsx
import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  Platform,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Region } from 'react-native-maps';
import { useLocationStore } from '../../stores/locationStore';
import { useReviewStore } from '../../stores';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.01;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

// デフォルトの位置（東京）
const DEFAULT_REGION: Region = {
  latitude: 35.6762,
  longitude: 139.6503,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const MapScreen: React.FC = () => {
  // Navigation hooks
  const isFocused = useIsFocused();
  
  // Zustand stores
  const location = useLocationStore((state) => state.location);
  const locationError = useLocationStore((state) => state.errorMsg);
  const isLocationLoading = useLocationStore((state) => state.isLoading);
  const { reviews } = useReviewStore();

  // Local state
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [isMapReady, setIsMapReady] = useState(false);
  const [lastValidRegion, setLastValidRegion] = useState<Region | null>(null);
  
  // Refs
  const mapRef = useRef<MapView>(null);
  const hasInitializedLocation = useRef(false);

  // デバッグログ
  console.log('MapScreen: レンダリング状態', {
    region,
    location,
    isLoading: isLocationLoading,
    errorMsg: locationError,
    locationError,
  });

  // 初期位置設定（最初の1回のみ）
  useEffect(() => {
    if (location && !hasInitializedLocation.current) {
      const newRegion: Region = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      };
      
      console.log('MapScreen: 初期region設定', newRegion);
      setRegion(newRegion);
      setLastValidRegion(newRegion);
      hasInitializedLocation.current = true;
    }
  }, [location]);

  // 画面フォーカス時の処理を改善
  useFocusEffect(
    useCallback(() => {
      console.log('MapScreen: 画面フォーカス');
      
      // タイマーを使って確実に地図を更新
      const timer = setTimeout(() => {
        if (isFocused && mapRef.current) {
          // 現在位置があれば使用、なければ最後の有効な位置を使用
          const targetRegion = location ? {
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          } : lastValidRegion;
          
          if (targetRegion) {
            console.log('MapScreen: 画面復帰 - 現在地にセンタリング');
            centerToLocation(targetRegion);
          }
        }
      }, 300);

      return () => {
        clearTimeout(timer);
        console.log('MapScreen: 画面アンフォーカス');
      };
    }, [isFocused, location, lastValidRegion])
  );

  // 位置にセンタリングする共通関数
  const centerToLocation = useCallback((targetRegion: Region) => {
    if (!mapRef.current) return;
    
    // stateを更新
    setRegion(targetRegion);
    setLastValidRegion(targetRegion);
    
    // MapViewを直接操作
    try {
      // fitToCoordinatesを使用してより確実に移動
      mapRef.current.fitToCoordinates(
        [{
          latitude: targetRegion.latitude,
          longitude: targetRegion.longitude,
        }],
        {
          edgePadding: {
            top: 50,
            right: 50,
            bottom: 50,
            left: 50,
          },
          animated: true,
        }
      );
      
      // animateToRegionも併用
      setTimeout(() => {
        mapRef.current?.animateToRegion(targetRegion, 800);
      }, 100);
    } catch (error) {
      console.error('MapScreen: センタリングエラー', error);
    }
  }, []);

  // 現在地へのセンタリング
  const centerToCurrentLocation = useCallback(() => {
    if (location) {
      const targetRegion: Region = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      };
      
      console.log('MapScreen: 現在地へセンタリング', targetRegion);
      centerToLocation(targetRegion);
    }
  }, [location, centerToLocation]);

  // MapViewのイベントハンドラー
  const handleMapReady = useCallback(() => {
    console.log('MapScreen: Map is ready');
    setIsMapReady(true);
    
    // マップ準備完了時に現在位置へ移動
    if (location && !hasInitializedLocation.current) {
      centerToCurrentLocation();
    }
  }, [location, centerToCurrentLocation]);

  // onLayoutハンドラー
  const handleMapLayout = useCallback(() => {
    console.log('MapScreen: Map layout complete');
    if (!isMapReady) {
      setIsMapReady(true);
    }
  }, [isMapReady]);

  // 地域変更の処理
  const handleRegionChangeComplete = useCallback((newRegion: Region) => {
    // 有効なregionの場合のみ保存
    if (newRegion && 
        newRegion.latitude !== 0 && 
        newRegion.longitude !== 0 &&
        !isNaN(newRegion.latitude) &&
        !isNaN(newRegion.longitude)) {
      setRegion(newRegion);
      setLastValidRegion(newRegion);
    }
  }, []);

  // カスタム現在地ボタン
  const MyLocationButton = () => (
    <TouchableOpacity
      style={styles.myLocationButton}
      onPress={centerToCurrentLocation}
      activeOpacity={0.7}
    >
      <Icon name="my-location" size={24} color="#4285F4" />
    </TouchableOpacity>
  );

  // initialRegionの計算
  const getInitialRegion = (): Region => {
    if (location) {
      return {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      };
    }
    return DEFAULT_REGION;
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={getInitialRegion()}
        onMapReady={handleMapReady}
        onLayout={handleMapLayout}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        loadingEnabled={true}
        loadingIndicatorColor="#666666"
        loadingBackgroundColor="#eeeeee"
        moveOnMarkerPress={false}
        // パフォーマンス設定
        zoomEnabled={true}
        zoomControlEnabled={true}
        rotateEnabled={true}
        scrollEnabled={true}
        pitchEnabled={true}
        toolbarEnabled={false}
        // 追加設定
        mapType="standard"
        userLocationPriority="high"
        userLocationUpdateInterval={5000}
        userLocationFastestInterval={2000}
        followsUserLocation={false}
        showsIndoors={true}
        showsBuildings={true}
        cacheEnabled={false} // キャッシュを無効化
        minZoomLevel={3}
        maxZoomLevel={20}
      >
        {/* レビューマーカーの表示 */}
        {reviews.map((review) => (
          <Marker
            key={review.id}
            coordinate={{
              latitude: review.latitude,
              longitude: review.longitude,
            }}
            title={review.title}
            description={review.description}
          />
        ))}
      </MapView>

      {/* カスタム現在地ボタン */}
      <MyLocationButton />

      {/* ローディング表示 */}
      {isLocationLoading && !location && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4285F4" />
            <Text style={styles.loadingText}>位置情報を取得中...</Text>
          </View>
        </View>
      )}

      {/* エラー表示 */}
      {locationError && !isLocationLoading && (
        <View style={styles.errorContainer}>
          <View style={styles.errorBanner}>
            <Icon name="error-outline" size={20} color="#ff6b6b" />
            <Text style={styles.errorText}>{locationError}</Text>
          </View>
        </View>
      )}

      {/* デバッグ情報（開発環境のみ） */}
      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>
            Ready: {isMapReady ? '✓' : '✗'} | Focus: {isFocused ? '✓' : '✗'}
          </Text>
          {location && (
            <Text style={styles.debugText}>
              Loc: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </Text>
          )}
          <Text style={styles.debugText}>
            Reg: {region.latitude.toFixed(4)}, {region.longitude.toFixed(4)}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  myLocationButton: {
    position: 'absolute',
    right: 16,
    bottom: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  errorContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 80,
    left: 20,
    right: 20,
  },
  errorBanner: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b',
  },
  errorText: {
    color: '#333',
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  debugContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 8,
    borderRadius: 5,
  },
  debugText: {
    color: 'white',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});

export default MapScreen;