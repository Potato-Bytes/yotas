import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region, Marker } from 'react-native-maps';
import { debounce } from 'lodash';
import { useLocation } from '../../hooks/useLocation';
import { useFocusEffect } from '@react-navigation/native';
import { DEFAULT_MAP_REGION, MapRegion, ToiletLocation } from '../../types/maps';
import { getToiletIcon, getRatingBasedColor } from '../../utils/mapUtils';
import { sampleToilets } from '../../data/sampleToilets';
import { brightMapStyle } from '../../constants/mapStyles';
import { useMapPositionStore } from '../../stores/mapPositionStore';
import { useMapStore } from '../../stores/mapStore';

const MapScreen: React.FC = () => {
  const mapRef = useRef<MapView>(null);
  const [currentRegion, setCurrentRegion] = useState<MapRegion | null>(null);
  
  // 安全なcurrentRegionのセッター
  const setSafeCurrentRegion = useCallback((region: MapRegion | null) => {
    if (!region) {
      console.log('リージョンをnullに設定');
      setCurrentRegion(null);
      return;
    }
    
    // ギニアの座標かチェック
    const isGuinea = Math.abs(region.latitude - 9.9456) < 0.1 && Math.abs(region.longitude - (-9.7016)) < 0.1;
    const isValidJapan = region.latitude >= 24 && region.latitude <= 46 && region.longitude >= 123 && region.longitude <= 146;
    
    if (isGuinea) {
      console.error('⚠️ ギニアの座標が設定されようとしました！ブロックします:', region);
      return;
    }
    
    if (!isValidJapan) {
      console.warn('⚠️ 日本国外の座標が設定されようとしました:', region);
      return;
    }
    
    console.log('有効なリージョンを設定:', region);
    setCurrentRegion(region);
  }, []);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [toiletLocations, setToiletLocations] = useState<ToiletLocation[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const {
    isLoading: isLocationLoading,
    getCurrentLocation,
  } = useLocation();

  const { 
    currentMapPosition, 
    setCurrentMapPosition, 
    clearCurrentMapPosition, 
    hasValidPosition 
  } = useMapPositionStore();

  // 統合されたmapStoreも使用
  const {
    lastMapRegion,
    userLocation: storedUserLocation,
    setLastMapRegion,
    setUserLocation: setStoredUserLocation,
    setLocationEnabled,
  } = useMapStore();

  // 現在位置に移動（シンプル版）
  const moveToCurrentLocation = useCallback(async () => {
    console.log('=== 現在位置取得開始 ===');
    
    try {
      const currentUserLocation = await getCurrentLocation();
      console.log('現在位置取得結果:', currentUserLocation);
      
      if (currentUserLocation) {
        const region: MapRegion = {
          latitude: currentUserLocation.latitude,
          longitude: currentUserLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        
        console.log('設定するリージョン:', region);
        
        // 直接設定（nullをセットしない）
        setSafeCurrentRegion(region);
        setUserLocation(currentUserLocation);
        setStoredUserLocation(currentUserLocation); // 統合ストアにも保存
        setLocationEnabled(true); // 位置情報が有効であることを記録
        setIsFollowingUser(true);
        setIsInitialLoad(false);
        
        // マップが準備できたらアニメーション
        if (mapRef.current && isMapReady) {
          console.log('マップをアニメーションで移動中');
          mapRef.current.animateToRegion(region, 1000);
        }
      } else {
        console.error('現在位置が取得できませんでした');
      }
    } catch (error) {
      console.error('現在位置取得エラー:', error);
    }
  }, [getCurrentLocation, isMapReady, setSafeCurrentRegion, setStoredUserLocation, setLocationEnabled]);

  // デバウンス機能付きの地域保存処理
  const debouncedSaveRegion = useCallback(
    debounce((region: MapRegion) => {
      console.log('デバウンス後の位置保存:', region);
      setCurrentMapPosition(region);
      setLastMapRegion(region);
    }, 500),
    [setCurrentMapPosition, setLastMapRegion]
  );

  // 地図の領域変更時の処理
  const handleRegionChangeComplete = useCallback((region: Region) => {
    console.log('地図領域が変更されました:', region);
    const newRegion = {
      latitude: region.latitude,
      longitude: region.longitude,
      latitudeDelta: region.latitudeDelta,
      longitudeDelta: region.longitudeDelta,
    };
    setSafeCurrentRegion(newRegion);
    
    // 初期読み込み完了後のユーザー操作のみ位置を保存（デバウンス）
    if (!isInitialLoad) {
      console.log('位置保存をデバウンス中:', newRegion);
      debouncedSaveRegion(newRegion);
    } else {
      console.log('初期読み込み中のため位置保存をスキップ');
    }
    
    setIsFollowingUser(false);
  }, [isInitialLoad, debouncedSaveRegion, setSafeCurrentRegion]);

  // 初期化
  useEffect(() => {
    console.log('=== MapScreen初期化 ===');
    setToiletLocations(sampleToilets);
    
    const initializeMap = () => {
      // 状態を初期化
      setIsFollowingUser(false);
      setIsInitialLoad(true);
      
      console.log('マップ画面初期化完了');
    };
    
    initializeMap();
  }, []);

  // 画面フォーカス時の処理
  useFocusEffect(
    useCallback(() => {
      console.log('=== マップ画面にフォーカスが当たりました ===');
      console.log('現在のリージョン:', currentRegion);
      console.log('統合ストア - 最後の位置:', lastMapRegion);
      console.log('メモリストア - 保存された位置:', currentMapPosition);
      console.log('有効な位置があるか:', hasValidPosition());
      
      // 統合ストアの位置を優先的に復元
      const savedRegion = lastMapRegion || currentMapPosition;
      
      if (savedRegion && !currentRegion) {
        console.log('保存された位置を復元:', savedRegion);
        setSafeCurrentRegion(savedRegion);
        setIsInitialLoad(false);
        
        // 保存されたユーザー位置も復元
        if (storedUserLocation) {
          setUserLocation(storedUserLocation);
        }
        
        // マップが準備完了後にアニメーション
        if (mapRef.current && isMapReady) {
          setTimeout(() => {
            mapRef.current?.animateToRegion(savedRegion, 500);
          }, 100);
        }
      } else if (!currentRegion) {
        console.log('保存された位置がないため現在位置を取得');
        moveToCurrentLocation();
      }
    }, [
      currentRegion, 
      lastMapRegion, 
      currentMapPosition, 
      storedUserLocation,
      hasValidPosition, 
      moveToCurrentLocation, 
      setSafeCurrentRegion, 
      setUserLocation,
      isMapReady
    ])
  );

  return (
    <View style={styles.container}>
      {/* 地図 */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={DEFAULT_MAP_REGION}
        region={currentRegion || DEFAULT_MAP_REGION}
        onRegionChangeComplete={handleRegionChangeComplete}
        onMapReady={() => {
          console.log('マップが準備完了');
          console.log('現在のリージョン:', currentRegion);
          console.log('トイレ位置数:', toiletLocations.length);
          console.log('ユーザー位置:', userLocation);
          setIsMapReady(true);
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        mapType="standard"
        customMapStyle={brightMapStyle}
        toolbarEnabled={false}
        moveOnMarkerPress={false}
        onError={(error) => {
          console.error('MapViewエラー:', error);
          // エラーが発生した場合は現在位置を再取得
          moveToCurrentLocation();
        }}
      >
        {/* トイレマーカー */}
        {toiletLocations.map(toilet => (
          <Marker
            key={toilet.id}
            coordinate={{
              latitude: toilet.latitude,
              longitude: toilet.longitude,
            }}
            title={toilet.title}
            description={toilet.description}
          >
            <View
              style={[styles.markerContainer, { backgroundColor: getRatingBasedColor(toilet.rating) }]}
            >
              <Text style={styles.markerIcon}>{getToiletIcon(toilet.type)}</Text>
              {toilet.isAccessible && (
                <View style={styles.accessibleBadge}>
                  <Text style={styles.accessibilityIcon}>♿</Text>
                </View>
              )}
            </View>
          </Marker>
        ))}

        {/* 現在位置マーカー */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="現在位置"
            description="あなたの現在位置です"
          >
            <View style={styles.userLocationMarker}>
              <Text style={styles.userLocationIcon}>●</Text>
            </View>
          </Marker>
        )}
      </MapView>

      {/* 位置取得中のオーバーレイ */}
      {!currentRegion && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <Text style={styles.loadingText}>📍 現在位置を取得中...</Text>
          </View>
        </View>
      )}


      {/* 浮きボタン */}
      <View style={styles.floatingButtons}>
        {/* 現在位置ボタン */}
        <TouchableOpacity
          style={[
            styles.floatingButton,
            isFollowingUser && styles.activeButton,
            isLocationLoading && styles.loadingButton,
          ]}
          onPress={moveToCurrentLocation}
          disabled={isLocationLoading}
        >
          <Text style={{fontSize: 24, color: isFollowingUser ? '#4285f4' : '#333'}}>
            {isLocationLoading ? '🔄' : '📍'}
          </Text>
        </TouchableOpacity>
        
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
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
    zIndex: 1000,
  },
  loadingContent: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  floatingButtons: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    alignItems: 'center',
  },
  floatingButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  activeButton: {
    backgroundColor: '#e3f2fd',
  },
  loadingButton: {
    opacity: 0.6,
  },
  markerContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerIcon: {
    fontSize: 16,
  },
  accessibleBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  userLocationMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285f4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  userLocationIcon: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  accessibilityIcon: {
    fontSize: 8,
    color: '#fff',
  },
});

export default MapScreen;