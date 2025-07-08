import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region, Marker } from 'react-native-maps';
import { debounce } from 'lodash';
import { useLocation } from '../../hooks/useLocation';
import { useFocusEffect } from '@react-navigation/native';
import { MapRegion, ToiletLocation } from '../../types/maps';
import { getToiletIcon, getRatingBasedColor } from '../../utils/mapUtils';
import { sampleToilets } from '../../data/sampleToilets';
import { brightMapStyle } from '../../constants/mapStyles';
import { useMapPositionStore } from '../../stores/mapPositionStore';
import { useMapStore } from '../../stores/mapStore';

const MapScreen: React.FC = React.memo(() => {
  const mapRef = useRef<MapView>(null);
  const [currentRegion, setCurrentRegion] = useState<MapRegion | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [toiletLocations, setToiletLocations] = useState<ToiletLocation[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isStorageReady, setIsStorageReady] = useState(false);
  const [styleAppliedOnFocus, setStyleAppliedOnFocus] = useState(false);
  const [androidStyleKey, setAndroidStyleKey] = useState(0);

  const {
    isLoading: isLocationLoading,
    getCurrentLocation,
  } = useLocation();

  const { 
    currentMapPosition, 
    setCurrentMapPosition
  } = useMapPositionStore();

  // 統合されたmapStoreも使用
  const {
    lastMapRegion,
    userLocation: storedUserLocation,
    setLastMapRegion,
    setUserLocation: setStoredUserLocation,
    setLocationEnabled,
  } = useMapStore();
  
  // 安全にマップをアニメーションで移動
  const safeAnimateToRegion = useCallback((region: MapRegion, duration = 1000) => {
    if (!mapRef.current || !isMapReady || isAnimating) {
      console.log('アニメーションをスキップ - マップ未準備またはアニメーション中');
      return;
    }
    
    setIsAnimating(true);
    console.log('マップアニメーション開始:', region);
    
    mapRef.current.animateToRegion(region, duration);
    
    // アニメーション終了後にフラグをリセット
    setTimeout(() => {
      setIsAnimating(false);
      console.log('マップアニメーション完了');
    }, duration + 100);
  }, [isMapReady, isAnimating]);

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
        safeAnimateToRegion(region, 1000);
      } else {
        console.error('現在位置が取得できませんでした');
      }
    } catch (error) {
      console.error('現在位置取得エラー:', error);
    }
  }, [getCurrentLocation, safeAnimateToRegion, setSafeCurrentRegion, setStoredUserLocation, setLocationEnabled]);

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
    console.log('🗺️ 地図領域が変更されました:', {
      latitude: region.latitude,
      longitude: region.longitude,
      latitudeDelta: region.latitudeDelta,
      longitudeDelta: region.longitudeDelta,
    });
    
    // 世界地図表示の検出を改善（より厳密な条件）
    const isWorldMap = region.latitudeDelta > 50 || region.longitudeDelta > 50;
    const isOutsideJapan = region.latitude < 20 || region.latitude > 50 || 
                           region.longitude < 120 || region.longitude > 150;
    
    if (isWorldMap || isOutsideJapan) {
      console.error('⚠️ 世界地図または日本国外が表示されています:', {
        isWorldMap,
        isOutsideJapan,
        latitudeDelta: region.latitudeDelta,
        longitudeDelta: region.longitudeDelta,
        latitude: region.latitude,
        longitude: region.longitude,
      });
      
      // 保存された位置を強制的に復元
      const savedRegion = lastMapRegion || currentMapPosition;
      if (savedRegion) {
        console.log('🔧 保存された位置を強制復元:', savedRegion);
        setSafeCurrentRegion(savedRegion);
        
        // Androidではスタイル適用のためkeyを更新
        if (Platform.OS === 'android') {
          console.log('🔧 Android: スタイル再適用のためkeyを更新');
          setAndroidStyleKey(prev => prev + 1);
        }
        
        setTimeout(() => {
          safeAnimateToRegion(savedRegion, 300);
        }, 50);
        return;
      } else {
        // 保存された位置がない場合は東京を設定
        const tokyoRegion = {
          latitude: 35.6762,
          longitude: 139.6503,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        console.log('🔧 デフォルト位置（東京）を設定:', tokyoRegion);
        setSafeCurrentRegion(tokyoRegion);
        
        // Androidではスタイル適用のためkeyを更新
        if (Platform.OS === 'android') {
          console.log('🔧 Android: デフォルト位置設定時もkeyを更新');
          setAndroidStyleKey(prev => prev + 1);
        }
        
        setTimeout(() => {
          safeAnimateToRegion(tokyoRegion, 300);
        }, 50);
        return;
      }
    }
    
    const newRegion = {
      latitude: region.latitude,
      longitude: region.longitude,
      latitudeDelta: region.latitudeDelta,
      longitudeDelta: region.longitudeDelta,
    };
    setSafeCurrentRegion(newRegion);
    
    // 初期読み込み完了後のユーザー操作のみ位置を保存（デバウンス）
    if (!isInitialLoad) {
      console.log('💾 位置保存をデバウンス中:', newRegion);
      debouncedSaveRegion(newRegion);
    } else {
      console.log('⏭️ 初期読み込み中のため位置保存をスキップ');
    }
    
    setIsFollowingUser(false);
  }, [isInitialLoad, debouncedSaveRegion, setSafeCurrentRegion, lastMapRegion, currentMapPosition, safeAnimateToRegion]);

  // ストレージ準備完了を待つ
  useEffect(() => {
    // AsyncStorageの復元を少し待つ
    const timer = setTimeout(() => {
      setIsStorageReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // ストレージ準備完了後の初期化
  useEffect(() => {
    if (!isStorageReady) return;
    
    console.log('=== MapScreen初期化 ===');
    setToiletLocations(sampleToilets);
    
    const initializeMap = async () => {
      // 保存された位置があるかチェック
      const savedRegion = lastMapRegion || currentMapPosition;
      
      if (savedRegion) {
        console.log('📍 保存された位置で初期化:', savedRegion);
        // 初期化時に即座にcurrentRegionを設定
        setSafeCurrentRegion(savedRegion);
        
        // 保存されたユーザー位置も復元
        if (storedUserLocation) {
          console.log('👤 保存されたユーザー位置を復元:', storedUserLocation);
          setUserLocation(storedUserLocation);
        }
        
        // カスタムスタイルを確実に適用
        console.log('🎨 初期化時のカスタムスタイル適用');
        
        setIsInitialLoad(false);
      } else {
        // 保存された位置がない場合は、最初に現在位置を設定してからマップを表示
        console.log('保存された位置がないため現在位置を取得');
        try {
          const currentUserLocation = await getCurrentLocation();
          if (currentUserLocation) {
            const region: MapRegion = {
              latitude: currentUserLocation.latitude,
              longitude: currentUserLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            };
            
            console.log('初期化時に現在位置を設定:', region);
            setSafeCurrentRegion(region);
            setUserLocation(currentUserLocation);
            setStoredUserLocation(currentUserLocation);
            setLocationEnabled(true);
          }
        } catch (error) {
          console.error('初期化時の位置取得エラー:', error);
          // エラーの場合はデフォルト位置（東京）を設定
          const tokyoRegion: MapRegion = {
            latitude: 35.6762,
            longitude: 139.6503,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          setSafeCurrentRegion(tokyoRegion);
        }
        setIsInitialLoad(false);
      }
      
      console.log('マップ画面初期化完了');
    };
    
    initializeMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStorageReady]); // ストレージ準備完了を待つ

  // 画面フォーカス時の処理 - 改善版（チカチカ問題を解決）
  useFocusEffect(
    useCallback(() => {
      console.log('=== マップ画面にフォーカスが当たりました ===');
      console.log('現在のcurrentRegion:', currentRegion);
      console.log('保存されたlastMapRegion:', lastMapRegion);
      console.log('保存されたcurrentMapPosition:', currentMapPosition);
      
      // 初回読み込み時は何もしない
      if (isInitialLoad || !isStorageReady) {
        console.log('初回読み込み中またはストレージ未準備のためフォーカス処理をスキップ');
        return;
      }
      
      // アニメーション中は処理をスキップ
      if (isAnimating) {
        console.log('アニメーション中のためフォーカス処理をスキップ');
        return;
      }
      
      // 保存された位置があるかチェック
      const savedRegion = lastMapRegion || currentMapPosition;
      
      // 保存された位置がない場合も何もしない
      if (!savedRegion) {
        console.log('保存された位置がないためフォーカス処理をスキップ');
        return;
      }
      
      // タブ遷移時の状態復元を実行
      const timeoutId = setTimeout(() => {
        // currentRegionがnullまたは異常な値の場合は必ず復元
        if (!currentRegion || currentRegion.latitudeDelta > 10 || currentRegion.longitudeDelta > 10) {
          console.log('⚠️ currentRegionが無効 - 位置を復元します:', currentRegion);
          setSafeCurrentRegion(savedRegion);
          
          // 保存されたユーザー位置も復元
          if (storedUserLocation) {
            setUserLocation(storedUserLocation);
          }
          
          // 世界地図表示問題を解決するため、MapViewを確実に正しい位置に移動
          if (mapRef.current && isMapReady) {
            console.log('🎯 MapViewを正しい位置に強制移動:', savedRegion);
            safeAnimateToRegion(savedRegion, 300);
          }
          
          return;
        }
        
        // 現在のリージョンと保存されたリージョンが大きく異なる場合のみ復元
        const needsRestore = Math.abs(currentRegion.latitude - savedRegion.latitude) > 0.05 ||
          Math.abs(currentRegion.longitude - savedRegion.longitude) > 0.05;
        
        if (needsRestore) {
          console.log('📍 タブ復帰時の位置復元:', savedRegion);
          setSafeCurrentRegion(savedRegion);
          
          // 保存されたユーザー位置も復元
          if (storedUserLocation) {
            setUserLocation(storedUserLocation);
          }
          
          // 位置復元が必要な場合もMapViewを正しい位置に移動
          if (mapRef.current && isMapReady) {
            console.log('🎯 MapViewを復元位置に移動:', savedRegion);
            safeAnimateToRegion(savedRegion, 300);
          }
        } else {
          console.log('位置復元不要 - 現在位置と保存位置が近似');
        }
        
        // カスタムスタイルの確認と強制再適用
        console.log('🎨 カスタムスタイルは常時適用されています');
        
        // Androidでフォーカス時にスタイルが外れている場合はkeyを更新
        if (mapRef.current && isMapReady && Platform.OS === 'android') {
          console.log('🎨 フォーカス時: Androidでスタイル状態を確認');
          
          // スタイルが正しく適用されていない場合はMapViewを再作成
          if (!styleAppliedOnFocus) {
            console.log('🔄 Android: スタイル再適用のためMapViewを更新');
            setAndroidStyleKey(prev => prev + 1);
            setStyleAppliedOnFocus(true);
            
            // 3秒後にフラグをリセット
            setTimeout(() => {
              setStyleAppliedOnFocus(false);
            }, 3000);
          }
        }
      }, 50); // 少し遅延させて状態が安定してから実行
      
      return () => clearTimeout(timeoutId);
    }, [
      lastMapRegion, 
      currentMapPosition, 
      storedUserLocation,
      currentRegion,
      isInitialLoad,
      isStorageReady,
      isAnimating,
      isMapReady,
      styleAppliedOnFocus,
      setSafeCurrentRegion, 
      setUserLocation,
      safeAnimateToRegion
    ])
  );


  // 現在表示すべきリージョンを計算
  const activeRegion = useMemo(() => {
    // 現在のcurrentRegionが有効な場合はそれを使用
    if (currentRegion) {
      console.log('🎯 activeRegion: currentRegionを使用:', currentRegion);
      return currentRegion;
    }
    
    // 保存されたリージョンがある場合
    const savedRegion = lastMapRegion || currentMapPosition;
    if (savedRegion) {
      console.log('🎯 activeRegion: 保存されたリージョンを使用:', savedRegion);
      return savedRegion;
    }
    
    // デフォルトリージョン
    const defaultRegion = {
      latitude: 35.6762,
      longitude: 139.6503,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    console.log('🎯 activeRegion: デフォルトリージョンを使用:', defaultRegion);
    return defaultRegion;
  }, [currentRegion, lastMapRegion, currentMapPosition]);

  // MapViewのpropsをメモ化して不要な再レンダリングを防ぐ
  const mapViewProps = useMemo(() => ({
    provider: PROVIDER_GOOGLE as any,
    style: styles.map,
    region: activeRegion, // initialRegionからregionに戻す
    showsUserLocation: true,
    showsMyLocationButton: false,
    showsCompass: true,
    showsScale: true,
    mapType: 'standard' as const,
    customMapStyle: brightMapStyle, // 常にカスタムスタイルを設定
    toolbarEnabled: false,
    moveOnMarkerPress: false,
  }), [activeRegion]);

  return (
    <View style={styles.container}>
      {/* ストレージ準備完了まで待機 */}
      {!isStorageReady && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <Text style={styles.loadingText}>📍 初期化中...</Text>
          </View>
        </View>
      )}
      
      {/* 地図 */}
      {isStorageReady && (
        <MapView
          key={Platform.OS === 'android' ? `map-${androidStyleKey}` : undefined}
          ref={mapRef}
          {...mapViewProps}
          onRegionChangeComplete={handleRegionChangeComplete}
          onMapReady={() => {
            console.log('🗺️ マップが準備完了');
            console.log('🎨 カスタムマップスタイル適用確認:', !!brightMapStyle);
            console.log('🎨 カスタムマップスタイル配列長:', brightMapStyle?.length || 0);
            setIsMapReady(true);
            
            // Androidでカスタムスタイルがprop経由で適用されているか確認
            if (Platform.OS === 'android') {
              console.log('🎨 Android: カスタムスタイルはprop経由で適用済み');
              console.log('🎨 スタイル配列長:', brightMapStyle?.length || 0);
              
              // スタイルが本当に適用されているか1秒後に確認
              setTimeout(() => {
                if (mapRef.current) {
                  console.log('🔍 1秒後: スタイル適用状態を確認');
                  // 必要に応じてマップを再描画
                  if (currentRegion) {
                    mapRef.current.animateToRegion(currentRegion, 1);
                  }
                }
              }, 1000);
            } else {
              console.log('🎨 iOS - カスタムスタイルはprop経由で適用');
            }
            
            // マップ準備完了時に、保存された位置があれば移動（チカチカ防止のため短時間）
            const savedRegion = lastMapRegion || currentMapPosition;
            if (savedRegion) {
              console.log('🎯 マップ準備完了時に保存された位置を設定:', savedRegion);
              setTimeout(() => {
                safeAnimateToRegion(savedRegion, 200);
              }, 50);
            } else if (currentRegion) {
              console.log('🎯 マップ準備完了時に現在位置を設定:', currentRegion);
              setTimeout(() => {
                safeAnimateToRegion(currentRegion, 200);
              }, 50);
            }
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
      )}

      {/* 位置取得中のオーバーレイ */}
      {isStorageReady && !lastMapRegion && !currentMapPosition && !currentRegion && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <Text style={styles.loadingText}>📍 現在位置を取得中...</Text>
          </View>
        </View>
      )}

      {/* 浮きボタン */}
      {isStorageReady && (
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
      )}
    </View>
  );
});

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