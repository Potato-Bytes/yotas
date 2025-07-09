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
  const [region, setRegion] = useState<Region>(() => {
    // 初期値を位置情報から設定
    if (location) {
      return {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      };
    }
    return DEFAULT_REGION;
  });
  const [isMapReady, setIsMapReady] = useState(false);
  
  // Refs
  const mapRef = useRef<MapView>(null);
  const hasAnimatedToLocation = useRef(false);
  const lastFocusTime = useRef(0);

  // デバッグログ
  console.log('MapScreen: レンダリング状態', {
    region,
    location,
    isLoading: isLocationLoading,
    errorMsg: locationError,
    locationError,
  });

  // 位置情報が更新されたとき
  useEffect(() => {
    if (location && !hasAnimatedToLocation.current && isMapReady) {
      const newRegion: Region = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      };
      
      console.log('MapScreen: 初期region設定', newRegion);
      setRegion(newRegion);
      
      // MapViewに直接アニメーション
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
        hasAnimatedToLocation.current = true;
      }
    }
  }, [location, isMapReady]);

  // 画面フォーカス時の処理（デバウンス付き）
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      // 前回のフォーカスから500ms以内の場合は無視
      if (now - lastFocusTime.current < 500) {
        return;
      }
      lastFocusTime.current = now;

      console.log('MapScreen: 画面フォーカス');
      
      // フォーカス時に現在位置へ移動
      if (isFocused && location && mapRef.current && isMapReady) {
        const timer = setTimeout(() => {
          if (mapRef.current && isFocused) {
            const targetRegion: Region = {
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: LATITUDE_DELTA,
              longitudeDelta: LONGITUDE_DELTA,
            };
            
            console.log('MapScreen: 画面復帰 - 現在地にセンタリング');
            mapRef.current.animateCamera({
              center: {
                latitude: targetRegion.latitude,
                longitude: targetRegion.longitude,
              },
              zoom: 15, // ズームレベルを指定
            }, { duration: 1000 });
          }
        }, 500); // タブ切り替えアニメーション完了を待つ

        return () => {
          clearTimeout(timer);
          console.log('MapScreen: 画面アンフォーカス');
        };
      }
    }, [isFocused, location, isMapReady])
  );

  // 現在地へのセンタリング
  const centerToCurrentLocation = useCallback(() => {
    if (location && mapRef.current) {
      const targetRegion: Region = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      };
      
      console.log('MapScreen: 現在地へセンタリング', targetRegion);
      
      setRegion(targetRegion);
      mapRef.current.animateCamera({
        center: {
          latitude: targetRegion.latitude,
          longitude: targetRegion.longitude,
        },
        zoom: 15,
      }, { duration: 1000 });
    }
  }, [location]);

  // MapViewのイベントハンドラー
  const handleMapReady = useCallback(() => {
    console.log('MapScreen: Map is ready');
    setIsMapReady(true);
    
    // マップ準備完了時、位置情報があれば移動
    if (location && !hasAnimatedToLocation.current && mapRef.current) {
      const initialRegion: Region = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      };
      mapRef.current.animateToRegion(initialRegion, 1000);
      hasAnimatedToLocation.current = true;
    }
  }, [location]);

  // 地域変更の処理
  const handleRegionChangeComplete = useCallback((newRegion: Region) => {
    // 有効なregionの場合のみ更新
    if (newRegion && 
        newRegion.latitude && 
        newRegion.longitude &&
        Math.abs(newRegion.latitude) <= 90 &&
        Math.abs(newRegion.longitude) <= 180) {
      setRegion(newRegion);
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


  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        onMapReady={handleMapReady}
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
        // 重要: アニメーション設定
        animationEnabled={true}
        // カメラ設定
        camera={{
          center: {
            latitude: region.latitude,
            longitude: region.longitude,
          },
          pitch: 0,
          heading: 0,
          altitude: 0,
          zoom: 15,
        }}
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
      {location && <MyLocationButton />}

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