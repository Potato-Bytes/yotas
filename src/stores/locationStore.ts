import { create } from 'zustand';
import { Coordinate } from '../types/maps';

interface LocationState {
  location: Coordinate | null;
  error: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  
  // アクション
  initializeLocation: () => Promise<void>;
  refreshLocation: () => Promise<void>;
  reset: () => void;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  location: null,
  error: null,
  isLoading: false,
  isInitialized: false,

  initializeLocation: async () => {
    const state = get();
    if (state.isInitialized && state.location) {
      console.log('LocationStore: 既に初期化済み');
      return;
    }

    set({ isLoading: true, error: null });

    try {
      // 権限の確認
      console.log('LocationStore: 権限確認開始');
      
      // React Native Community Geolocationを使用
      const { PermissionsAndroid, Platform } = require('react-native');
      const Geolocation = require('@react-native-community/geolocation');
      
      let hasPermission = false;
      
      if (Platform.OS === 'android') {
        const permissionResult = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: '位置情報の許可',
            message: 'yotasが現在位置を取得するために位置情報の許可が必要です。',
            buttonNeutral: '後で',
            buttonNegative: 'キャンセル',
            buttonPositive: 'OK',
          }
        );
        hasPermission = permissionResult === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        hasPermission = true; // iOSはInfo.plistで設定済み
      }
      
      if (!hasPermission) {
        throw new Error('位置情報へのアクセスが拒否されました');
      }

      // 位置情報の取得（段階的な精度で試行）
      const accuracyLevels = [
        { accuracy: false, timeout: 8000 },  // 低精度で速く
        { accuracy: true, timeout: 15000 },  // 高精度
        { accuracy: false, timeout: 5000 }   // 最後の試行
      ];

      let currentLocation = null;

      for (let i = 0; i < accuracyLevels.length; i++) {
        const level = accuracyLevels[i];
        try {
          console.log(`LocationStore: 精度レベル${i + 1}で位置情報取得試行中...`);
          
          const locationPromise = new Promise<Coordinate>((resolve, reject) => {
            Geolocation.getCurrentPosition(
              (position: any) => {
                const locationData: Coordinate = {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                };
                resolve(locationData);
              },
              (error: any) => reject(error),
              {
                enableHighAccuracy: level.accuracy,
                timeout: level.timeout,
                maximumAge: 60000,
              }
            );
          });
          
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('位置情報取得タイムアウト')), level.timeout + 1000)
          );

          currentLocation = await Promise.race([locationPromise, timeoutPromise]);

          if (currentLocation) {
            console.log('LocationStore: 位置情報取得成功', currentLocation);
            set({ 
              location: currentLocation, 
              isLoading: false, 
              isInitialized: true,
              error: null 
            });
            return;
          }
        } catch (err) {
          console.log(`LocationStore: 精度レベル${i + 1}での取得失敗:`, err);
          continue;
        }
      }

      throw new Error('すべての精度レベルで位置情報の取得に失敗しました');

    } catch (error) {
      console.error('LocationStore: エラー発生:', error);
      set({ 
        error: error instanceof Error ? error.message : '位置情報の取得に失敗しました',
        isLoading: false,
        isInitialized: true
      });
    }
  },

  refreshLocation: async () => {
    console.log('LocationStore: 位置情報を更新');
    set({ isInitialized: false });
    await get().initializeLocation();
  },

  reset: () => {
    console.log('LocationStore: リセット');
    set({
      location: null,
      error: null,
      isLoading: false,
      isInitialized: false
    });
  }
}));