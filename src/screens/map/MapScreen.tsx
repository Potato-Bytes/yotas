import React, { useEffect, useState, useRef } from 'react';
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
  
  // 重要: 初期region設定の完了フラグ
  const isInitialRegionSet = useRef(false);
  // 重要: コンポーネントのマウント状態を管理
  const isMounted = useRef(true);

  useEffect(() => {
    // コンポーネントのクリーンアップ
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    console.log('MapScreen useEffect: 実行', {
      isInitialRegionSet: isInitialRegionSet.current,
      hasLocation: !!location,
      hasError: !!error,
      isLoading
    });

    // 重要: 既に初期設定が完了している場合は何もしない
    if (isInitialRegionSet.current || !isMounted.current) {
      console.log('MapScreen useEffect: 初期設定済みまたはアンマウント済み、処理をスキップ');
      return;
    }

    // 位置情報の取得が完了している場合
    if (!isLoading) {
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
        isInitialRegionSet.current = true; // フラグを立てる
      } else {
        // 位置情報が取得できなかった場合（エラーまたはタイムアウト）
        console.log('MapScreen: デフォルト地点でregion設定');
        setRegion(DEFAULT_REGION);
        isInitialRegionSet.current = true; // フラグを立てる
        
        // ユーザーに通知
        if (error && isMounted.current) {
          setTimeout(() => {
            Alert.alert(
              '位置情報取得エラー',
              `${error}\n\nデフォルトの地点（札幌駅）を表示します。`,
              [{ text: 'OK' }]
            );
          }, 100); // Alertの表示を少し遅らせる
        }
      }
    }
  }, [location, error, isLoading]); // 注意: regionは依存配列に含めない

  // ユーザー操作によるマップ移動のハンドラ
  const handleRegionChangeComplete = (newRegion: Region) => {
    // 重要: 実質的な変更があった場合のみ更新
    if (!region || !isMounted.current) return;
    
    const latDiff = Math.abs(region.latitude - newRegion.latitude);
    const lonDiff = Math.abs(region.longitude - newRegion.longitude);
    
    // 0.00001度 = 約1.1メートルの精度で変更を検出
    if (latDiff > 0.00001 || lonDiff > 0.00001) {
      console.log('MapScreen: ユーザー操作によるregion更新', {
        latDiff,
        lonDiff
      });
      setRegion(newRegion);
    }
  };

  // 現在地へ移動する関数
  const moveToCurrentLocation = () => {
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