import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region, Marker } from 'react-native-maps';
import { useLocation } from '../../hooks/useLocation';
import { DEFAULT_MAP_REGION, MapRegion, ToiletLocation } from '../../types/maps';
import { getToiletIcon, getToiletTypeColor } from '../../utils/mapUtils';
import { sampleToilets } from '../../data/sampleToilets';

const MapScreen: React.FC = () => {
  const mapRef = useRef<MapView>(null);
  const [currentRegion, setCurrentRegion] = useState<MapRegion | null>(null);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [toiletLocations, setToiletLocations] = useState<ToiletLocation[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const {
    isLoading: isLocationLoading,
    getCurrentLocation,
  } = useLocation();

  // 現在位置に移動
  const moveToCurrentLocation = useCallback(async () => {
    try {
      const currentUserLocation = await getCurrentLocation();
      if (currentUserLocation) {
        setUserLocation(currentUserLocation);
        const region: MapRegion = {
          latitude: currentUserLocation.latitude,
          longitude: currentUserLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };

        setCurrentRegion(region);
        setIsFollowingUser(true);
        setIsInitialLoad(false);

        // 初期読み込み後は地図をアニメーション
        if (mapRef.current && !isInitialLoad) {
          mapRef.current.animateToRegion(region, 1000);
        }
      }
    } catch (error) {
      console.error('現在位置取得エラー:', error);
      // エラー時はデフォルト位置を使用
      setCurrentRegion(DEFAULT_MAP_REGION);
      setIsInitialLoad(false);
    }
  }, [getCurrentLocation, isInitialLoad]);

  // 地図の領域変更時の処理
  const handleRegionChangeComplete = useCallback((region: Region) => {
    const newRegion = {
      latitude: region.latitude,
      longitude: region.longitude,
      latitudeDelta: region.latitudeDelta,
      longitudeDelta: region.longitudeDelta,
    };
    setCurrentRegion(newRegion);
    setIsFollowingUser(false);
  }, []);

  // 初期化時にサンプルデータの読み込みと現在位置の取得
  useEffect(() => {
    setToiletLocations(sampleToilets);
    // アプリ起動時に現在位置を取得してフォーカス
    moveToCurrentLocation();
  }, [moveToCurrentLocation]);

  return (
    <View style={styles.container}>
      {/* 現在位置取得中の表示 */}
      {!currentRegion && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>📍 現在位置を取得中...</Text>
        </View>
      )}
      
      {/* 地図 */}
      {currentRegion && (
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={currentRegion}
          onRegionChangeComplete={handleRegionChangeComplete}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={true}
          showsScale={true}
          mapType="standard"
          toolbarEnabled={false}
          moveOnMarkerPress={false}
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
              style={[styles.markerContainer, { backgroundColor: getToiletTypeColor(toilet.type) }]}
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