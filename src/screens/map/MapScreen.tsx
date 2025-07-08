import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  const locationData = useLocation(); // 安定した値が返される
  const { location, error, isLoading } = locationData;
  
  const [region, setRegion] = useState<Region | undefined>(undefined);
  const isInitialRegionSet = useRef(false);
  const isMounted = useRef(true);

  useEffect(() => {
    // コンポーネントのクリーンアップ
    return () => {
      isMounted.current = false;
    };
  }, []);

  // 初期regionの設定
  useEffect(() => {
    // 既に設定済みまたはローディング中は何もしない
    if (isInitialRegionSet.current || isLoading) {
      return;
    }

    console.log('MapScreen: region設定処理', { location, error, isLoading });

    if (location) {
      // 位置情報が取得できた場合
      const newRegion = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      
      console.log('MapScreen: 現在地でregion設定', newRegion);
      setRegion(newRegion);
      isInitialRegionSet.current = true;
    } else if (error) {
      // エラーの場合はデフォルト地点
      console.log('MapScreen: デフォルト地点でregion設定');
      setRegion(DEFAULT_REGION);
      isInitialRegionSet.current = true;
      
      // エラー通知
      setTimeout(() => {
        if (isMounted.current) {
          Alert.alert(
            '位置情報取得エラー',
            `${error}\n\nデフォルトの地点（札幌駅）を表示します。`,
            [{ text: 'OK' }]
          );
        }
      }, 500);
    }
  }, [location, error, isLoading]); // 安定した値なので安全

  // マップ操作のハンドラ（メモ化）
  const handleRegionChangeComplete = useCallback((newRegion: Region) => {
    if (!region || !isMounted.current) return;
    
    const latDiff = Math.abs(region.latitude - newRegion.latitude);
    const lonDiff = Math.abs(region.longitude - newRegion.longitude);
    
    if (latDiff > 0.00001 || lonDiff > 0.00001) {
      console.log('MapScreen: ユーザー操作によるregion更新');
      setRegion(newRegion);
    }
  }, [region]);

  // 現在地へ移動
  const moveToCurrentLocation = useCallback(() => {
    if (location && isMounted.current) {
      const currentRegion = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      setRegion(currentRegion);
    } else {
      Alert.alert('エラー', '現在地情報が取得できていません');
    }
  }, [location]);

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

  // 正常時のマップ表示
  return (
    <View style={styles.container}>
      <Map 
        region={region} 
        onRegionChangeComplete={handleRegionChangeComplete} 
      />
      {location && (
        <View style={styles.currentLocationButton}>
          <Button title="現在地へ" onPress={moveToCurrentLocation} />
        </View>
      )}
      {error && !location && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
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