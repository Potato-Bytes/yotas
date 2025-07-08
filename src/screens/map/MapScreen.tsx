import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button, Alert } from 'react-native';
import { Region } from 'react-native-maps';
import { Map } from '../../components/Map';
import { useLocation } from '../../hooks/useLocation';

// デフォルト地点（札幌駅）
const DEFAULT_REGION: Region = {
  latitude: 43.06866,
  longitude: 141.3507,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export default function MapScreen() {
  const { location, error, isLoading } = useLocation();
  const [region, setRegion] = useState<Region | undefined>(undefined);
  const [mapKey, setMapKey] = useState(0); // マップの再レンダリング用

  useEffect(() => {
    console.log('MapScreen: 位置情報状態更新', { 
      hasLocation: !!location, 
      hasError: !!error, 
      isLoading 
    });

    if (location && !region) {
      // 位置情報が取得できた場合
      const newRegion = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      console.log('MapScreen: 現在地でregion設定', newRegion);
      setRegion(newRegion);
    } else if (!isLoading && !location && !region) {
      // ローディング完了後、位置情報が取得できなかった場合
      console.log('MapScreen: デフォルト地点でregion設定');
      setRegion(DEFAULT_REGION);
      
      // ユーザーに通知
      if (error) {
        Alert.alert(
          '位置情報取得エラー',
          `${error}\n\nデフォルトの地点（札幌駅）を表示します。`,
          [{ text: 'OK' }]
        );
      }
    }
  }, [location, error, isLoading, region]);

  // ユーザー操作によるマップ移動のハンドラ
  const handleRegionChangeComplete = (newRegion: Region) => {
    // 無限ループ防止: 実質的な変更があった場合のみ更新
    if (!region || 
        Math.abs(region.latitude - newRegion.latitude) > 0.00001 ||
        Math.abs(region.longitude - newRegion.longitude) > 0.00001) {
      console.log('MapScreen: ユーザー操作によるregion更新');
      setRegion(newRegion);
    }
  };

  // 現在地へ移動する関数
  const moveToCurrentLocation = () => {
    if (location) {
      const currentRegion = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      setRegion(currentRegion);
      setMapKey(prev => prev + 1); // マップを再レンダリング
    } else {
      Alert.alert('エラー', '現在地情報が取得できていません');
    }
  };

  // ローディング中の表示
  if (isLoading || !region) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>
          現在地を取得中...{'\n'}
          <Text style={styles.subText}>
            GPS信号が弱い場合は時間がかかることがあります
          </Text>
        </Text>
      </View>
    );
  }

  // エラー時の表示（デフォルト地点表示）
  if (error && !location) {
    return (
      <View style={styles.container}>
        <Map 
          key={mapKey}
          region={region} 
          onRegionChangeComplete={handleRegionChangeComplete} 
        />
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      </View>
    );
  }

  // 正常時のマップ表示
  return (
    <View style={styles.container}>
      <Map 
        key={mapKey}
        region={region} 
        onRegionChangeComplete={handleRegionChangeComplete} 
      />
      {location && (
        <View style={styles.currentLocationButton}>
          <Button title="現在地へ" onPress={moveToCurrentLocation} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
  },
  subText: {
    fontSize: 12,
    color: '#666',
  },
  errorBanner: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    textAlign: 'center',
  },
  currentLocationButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});