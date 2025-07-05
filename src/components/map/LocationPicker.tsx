import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region, Marker } from 'react-native-maps';
import Icon from 'react-native-vector-icons/Ionicons';
import { Coordinate, DEFAULT_MAP_REGION } from '../../types/maps';
import { useLocation } from '../../hooks/useLocation';

interface LocationPickerProps {
  selectedLocation: Coordinate | null;
  onLocationSelect: (location: Coordinate) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

// Dimensions available if needed for future use
// const { width, height } = Dimensions.get('window');

const LocationPicker: React.FC<LocationPickerProps> = ({
  selectedLocation,
  onLocationSelect,
  onCancel,
  onConfirm,
}) => {
  const mapRef = useRef<MapView>(null);
  const [currentRegion, setCurrentRegion] = useState<Region>(
    selectedLocation
      ? {
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }
      : DEFAULT_MAP_REGION
  );

  const {
    getCurrentLocation,
    isLoading: isLocationLoading,
    showLocationError,
  } = useLocation();

  // 現在位置に移動
  const moveToCurrentLocation = useCallback(async () => {
    try {
      const userLocation = await getCurrentLocation();
      if (userLocation && mapRef.current) {
        const region: Region = {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };

        mapRef.current.animateToRegion(region, 1000);
        setCurrentRegion(region);
        onLocationSelect(userLocation);
      }
    } catch (error) {
      showLocationError();
    }
  }, [getCurrentLocation, showLocationError, onLocationSelect]);

  // 地図タップ時の処理
  const handleMapPress = useCallback((event: { nativeEvent: { coordinate: Coordinate } }) => {
    const { coordinate } = event.nativeEvent;
    onLocationSelect(coordinate);
  }, [onLocationSelect]);

  // 地図の領域変更時の処理
  const handleRegionChangeComplete = useCallback((region: Region) => {
    setCurrentRegion(region);
  }, []);

  // 確定前の確認
  const handleConfirm = useCallback(() => {
    if (!selectedLocation) {
      Alert.alert('エラー', '位置を選択してください');
      return;
    }

    Alert.alert(
      '位置の確認',
      '選択した位置でよろしいですか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '確定', onPress: onConfirm },
      ]
    );
  }, [selectedLocation, onConfirm]);

  // 初期位置を現在地に設定
  useEffect(() => {
    if (!selectedLocation) {
      moveToCurrentLocation();
    }
  }, [selectedLocation, moveToCurrentLocation]);

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={onCancel}>
          <Icon name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>位置を選択</Text>
        <TouchableOpacity 
          style={[styles.headerButton, styles.confirmButton]} 
          onPress={handleConfirm}
        >
          <Text style={styles.confirmButtonText}>確定</Text>
        </TouchableOpacity>
      </View>

      {/* 地図 */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={currentRegion}
          onRegionChangeComplete={handleRegionChangeComplete}
          onPress={handleMapPress}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={true}
        >
          {selectedLocation && (
            <Marker
              coordinate={selectedLocation}
              draggable={true}
              onDragEnd={(event) => {
                onLocationSelect(event.nativeEvent.coordinate);
              }}
            >
              <View style={styles.markerContainer}>
                <Icon name="location" size={30} color="#ff4757" />
              </View>
            </Marker>
          )}
        </MapView>

        {/* 中央の十字線（地図タップ用のガイド） */}
        <View style={styles.crosshair}>
          <View style={styles.crosshairHorizontal} />
          <View style={styles.crosshairVertical} />
        </View>

        {/* 現在位置ボタン */}
        <TouchableOpacity
          style={[styles.locationButton, isLocationLoading && styles.loadingButton]}
          onPress={moveToCurrentLocation}
          disabled={isLocationLoading}
        >
          <Icon 
            name={isLocationLoading ? "refresh" : "locate"} 
            size={24} 
            color="#4285f4" 
          />
        </TouchableOpacity>
      </View>

      {/* 底部の説明 */}
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          📍 地図をタップまたはマーカーをドラッグして位置を選択してください
        </Text>
        {selectedLocation && (
          <View style={styles.coordinates}>
            <Text style={styles.coordinateText}>
              緯度: {selectedLocation.latitude.toFixed(6)}
            </Text>
            <Text style={styles.coordinateText}>
              経度: {selectedLocation.longitude.toFixed(6)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
  },
  confirmButton: {
    backgroundColor: '#4285f4',
    paddingHorizontal: 16,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  crosshair: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 20,
    height: 20,
    marginTop: -10,
    marginLeft: -10,
    pointerEvents: 'none',
  },
  crosshairHorizontal: {
    position: 'absolute',
    top: 9,
    left: 0,
    width: 20,
    height: 2,
    backgroundColor: '#ff4757',
  },
  crosshairVertical: {
    position: 'absolute',
    top: 0,
    left: 9,
    width: 2,
    height: 20,
    backgroundColor: '#ff4757',
  },
  locationButton: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingButton: {
    opacity: 0.6,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructions: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  coordinates: {
    alignItems: 'center',
  },
  coordinateText: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },
});

export default LocationPicker;