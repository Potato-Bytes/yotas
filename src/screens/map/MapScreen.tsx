// src/screens/map/MapScreen.tsx
import React, { useRef, useState, useEffect } from 'react';
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
import { useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useMapStore } from '../../stores/mapStore';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.01;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

// 札幌のデフォルト位置（ユーザーの位置）
const SAPPORO_REGION: Region = {
  latitude: 43.0793,
  longitude: 141.3077,
  latitudeDelta: LATITUDE_DELTA,
  longitudeDelta: LONGITUDE_DELTA,
};

const MapScreen: React.FC = () => {
  // Navigation hooks
  const isFocused = useIsFocused();
  
  // Zustand stores
  const location = useLocationStore((state) => state.location);
  const locationError = useLocationStore((state) => state.errorMsg);
  const isLocationLoading = useLocationStore((state) => state.isLoading);
  const { reviews } = useReviewStore();
  
  // 新: 地図リージョンをグローバル保存
  const { lastRegion, setLastRegion } = useMapStore();
  const [region, setRegion] = useState<Region | null>(lastRegion);

  // MapView ref
  const mapRef = useRef<MapView>(null);
  
  // State
  const [isMapReady, setIsMapReady] = useState(false);

  // デバッグログ
  console.log('MapScreen: レンダリング状態', {
    region: location ? {
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    } : SAPPORO_REGION,
    location,
    isLoading: isLocationLoading,
    errorMsg: locationError,
    locationError,
  });

  // 画面フォーカス時に地図を更新
  useEffect(() => {
    if (isFocused && isMapReady && mapRef.current) {
      // 少し遅延を入れてタブ切り替えアニメーション完了を待つ
      const timer = setTimeout(() => {
        centerToCurrentLocation();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isFocused, isMapReady]);

  // 現在地が取れたら region を確定
  useEffect(() => {
    if (location) {
      const cur = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      };
      setRegion(prev => prev ?? cur);   // まだ設定されていなければ採用
      setLastRegion(cur);               // グローバルにも保存
    }
  }, [location]);

  // 「現在地へ」ボタン
  const centerToCurrentLocation = () => {
    if (!mapRef.current) return;
    if (!location) return;
    const target = {
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    };
    setRegion(target);
    setLastRegion(target);
    mapRef.current.animateToRegion(target, 700);
  };

  // MapViewのイベントハンドラー
  const handleMapReady = () => {
    console.log('MapScreen: Map is ready');
    setIsMapReady(true);
    
    // マップ準備完了後、すぐに現在位置へ移動
    setTimeout(() => {
      centerToCurrentLocation();
    }, 100);
  };

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
        region={region ?? SAPPORO_REGION}      // ★ 常に制御付き
        onRegionChangeComplete={r => {         // ★ 移動したら保存
          setRegion(r);
          setLastRegion(r);
        }}
        onMapReady={handleMapReady}
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
            Reg: {(region ?? SAPPORO_REGION).latitude.toFixed(4)}, {(region ?? SAPPORO_REGION).longitude.toFixed(4)}
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