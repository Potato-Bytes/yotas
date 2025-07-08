import React, { useState, useCallback } from 'react';
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

  // ユーザーがマップを操作した後のregionを保持
  // nullの場合は「ユーザーはまだ操作していない」を意味する
  const [userInteractedRegion, setUserInteractedRegion] = useState<Region | null>(null);

  // マップ操作完了時のコールバック
  const handleRegionChangeComplete = useCallback((newRegion: Region) => {
    console.log('MapScreen: ユーザーがマップを操作しました');
    setUserInteractedRegion(newRegion);
  }, []);

  // 現在地へ移動するボタンの処理
  const moveToCurrentLocation = useCallback(() => {
    console.log('MapScreen: 現在地へ移動ボタンが押されました');
    // ユーザー操作によるregionをリセット
    setUserInteractedRegion(null);
    
    if (!location) {
      Alert.alert('エラー', '現在地情報が取得できていません');
    }
  }, [location]);

  // ========== 宣言的なレンダリングロジック ==========
  
  // 1. ローディング中の場合
  if (isLoading) {
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

  // 2. 表示すべきregionを決定（useEffectを使わない純粋な計算）
  let displayRegion: Region;
  let regionSource: 'user' | 'gps' | 'default';

  if (userInteractedRegion) {
    // 優先度1: ユーザーがマップを操作した場合
    displayRegion = userInteractedRegion;
    regionSource = 'user';
  } else if (location) {
    // 優先度2: GPSの現在地が取得できている場合
    displayRegion = {
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };
    regionSource = 'gps';
  } else {
    // 優先度3: 上記以外（エラー発生時など）
    displayRegion = DEFAULT_REGION;
    regionSource = 'default';
  }

  console.log(`MapScreen: region決定 - ソース: ${regionSource}`, displayRegion);

  // 3. 決定したregionでマップを描画
  return (
    <View style={styles.container}>
      <Map 
        region={displayRegion}
        onRegionChangeComplete={handleRegionChangeComplete} 
      />
      
      {/* エラーメッセージバナー（ユーザー操作前のみ表示） */}
      {error && !userInteractedRegion && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>
            ⚠️ {error}{'\n'}
            デフォルトの地点（札幌駅）を表示しています
          </Text>
        </View>
      )}

      {/* 現在地へ移動ボタン */}
      {location && (
        <View style={styles.currentLocationButton}>
          <Button 
            title="現在地へ" 
            onPress={moveToCurrentLocation}
            color="#007AFF"
          />
        </View>
      )}

      {/* デバッグ情報（開発時のみ） */}
      {__DEV__ && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>
            Source: {regionSource}
          </Text>
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 15,
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
    lineHeight: 20,
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
    overflow: 'hidden',
  },
  debugInfo: {
    position: 'absolute',
    top: 100,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 5,
    borderRadius: 5,
  },
  debugText: {
    color: 'white',
    fontSize: 12,
  },
});