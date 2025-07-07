import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MapRegion } from '../types/maps';

// ギニアやその他の問題のある座標をチェック
const isProblematicCoordinate = (region: MapRegion): boolean => {
  // ギニアの座標範囲
const guineaLat = 9.9456;
  const guineaLng = -9.7016;
  
  // アフリカ大陸の幅広い範囲をチェックし、日本以外の地域をブロック
  const isInAfrica = region.latitude >= -35 && region.latitude <= 37 && region.longitude >= -20 && region.longitude <= 52;
  const isInJapan = region.latitude >= 20 && region.latitude <= 50 && region.longitude >= 120 && region.longitude <= 150;
  
  // 日本以外のアフリカ地域はブロック
  if (isInAfrica && !isInJapan) {
    return true;
  }
  
  // 特定のギニア座標もブロック
  if (Math.abs(region.latitude - guineaLat) < 0.1 && Math.abs(region.longitude - guineaLng) < 0.1) {
    return true;
  }
  
  return false;
};

interface MapState {
  lastMapRegion: MapRegion | null;
  userLocation: { latitude: number; longitude: number } | null;
  isLocationEnabled: boolean;
  setLastMapRegion: (region: MapRegion | null) => void;
  setUserLocation: (location: { latitude: number; longitude: number } | null) => void;
  setLocationEnabled: (enabled: boolean) => void;
  clearLastMapRegion: () => void;
  resetMapState: () => void;
  forceResetStorage: () => Promise<void>;
}

export const useMapStore = create<MapState>()(
  persist(
    (set) => ({
      lastMapRegion: null,
      userLocation: null,
      isLocationEnabled: false,
      
      setLastMapRegion: (region) => {
        // 座標が有効かチェック
        if (
          region &&
          typeof region.latitude === 'number' &&
          typeof region.longitude === 'number' &&
          typeof region.latitudeDelta === 'number' &&
          typeof region.longitudeDelta === 'number' &&
          !isNaN(region.latitude) &&
          !isNaN(region.longitude) &&
          !isNaN(region.latitudeDelta) &&
          !isNaN(region.longitudeDelta) &&
          region.latitude >= -90 &&
          region.latitude <= 90 &&
          region.longitude >= -180 &&
          region.longitude <= 180 &&
          region.latitudeDelta > 0 &&
          region.longitudeDelta > 0
        ) {
          // 問題のある座標かチェック
          if (isProblematicCoordinate(region)) {
            console.warn('⚠️ 問題のある座標のため保存をスキップ:', region);
            return;
          }
          
          console.log('有効なマップ領域を保存:', region);
          set({ lastMapRegion: region });
        } else {
          console.warn('無効なマップ領域のため保存をスキップ:', region);
        }
      },
      
      setUserLocation: (location) => {
        console.log('ユーザー位置を更新:', location);
        set({ userLocation: location });
      },
      
      setLocationEnabled: (enabled) => {
        console.log('位置情報有効化状態を更新:', enabled);
        set({ isLocationEnabled: enabled });
      },
      
      clearLastMapRegion: () => set({ lastMapRegion: null }),
      
      resetMapState: () => set({
        lastMapRegion: null,
        userLocation: null,
        isLocationEnabled: false,
      }),
      
      forceResetStorage: async () => {
        try {
          await AsyncStorage.removeItem('map-storage');
          console.log('AsyncStorageのマップデータを完全削除しました');
          set({ lastMapRegion: null, userLocation: null, isLocationEnabled: false });
        } catch (error) {
          console.error('AsyncStorageのクリアに失敗:', error);
        }
      },
    }),
    {
      name: 'map-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        lastMapRegion: state.lastMapRegion,
        userLocation: state.userLocation,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('AsyncStorageからのデータ復元エラー:', error);
        } else {
          console.log('AsyncStorageからデータを復元:', state);
          if (state?.lastMapRegion) {
            const region = state.lastMapRegion;
            const isGuinea = Math.abs(region.latitude - 9.9456) < 0.1 && Math.abs(region.longitude - (-9.7016)) < 0.1;
            const isValidJapan = region.latitude >= 24 && region.latitude <= 46 && region.longitude >= 123 && region.longitude <= 146;
            
            if (isGuinea || !isValidJapan) {
              console.error('⚠️ AsyncStorageに無効な座標が保存されています！強制削除します:', region);
              // 無効な座標を検出したら即座にクリア
              const AsyncStorage = require('@react-native-async-storage/async-storage').default;
              AsyncStorage.clear().then(() => {
                console.log('無効な座標を含むAsyncStorageを全削除しました');
              });
              return { lastMapRegion: null, userLocation: null };
            }
          }
        }
      },
    }
  )
);