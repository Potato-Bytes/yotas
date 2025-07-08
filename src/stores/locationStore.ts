import { create } from 'zustand';
import * as Location from 'expo-location';

interface LocationState {
  location: Location.LocationObject | null;
  errorMsg: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  
  // アクション
  initializeLocation: () => Promise<void>;
  refreshLocation: () => Promise<void>;
  reset: () => void;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  location: null,
  errorMsg: null,
  isLoading: true,
  isInitialized: false,

  initializeLocation: async () => {
    // 既に初期化済みの場合はスキップ
    if (get().isInitialized && get().location) {
      console.log('LocationStore: 既に初期化済み');
      return;
    }

    set({ isLoading: true, errorMsg: null });
    console.log('LocationStore: 位置情報取得プロセス開始');

    try {
      // 1. 権限の確認
      console.log('LocationStore: 権限確認開始');
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        throw new Error('位置情報へのアクセスが拒否されました。設定から権限を許可してください。');
      }
      
      console.log('LocationStore: 権限確認完了');

      // 2. 位置情報サービスが有効か確認
      const isLocationEnabled = await Location.hasServicesEnabledAsync();
      if (!isLocationEnabled) {
        throw new Error('位置情報サービスが無効です。設定から有効にしてください。');
      }

      // 3. 位置情報の取得（段階的に精度を変更）
      const accuracyLevels = [
        { 
          accuracy: Location.Accuracy.Balanced, 
          name: 'Balanced',
          timeout: 10000 
        },
        { 
          accuracy: Location.Accuracy.High, 
          name: 'High',
          timeout: 15000 
        },
        { 
          accuracy: Location.Accuracy.Highest, 
          name: 'Highest',
          timeout: 20000 
        }
      ];

      let lastError: Error | null = null;

      for (const level of accuracyLevels) {
        try {
          console.log(`LocationStore: 精度[${level.name}]で位置情報取得試行中...`);
          
          // タイムアウト付きで位置情報を取得
          const locationPromise = Location.getCurrentPositionAsync({
            accuracy: level.accuracy,
            distanceInterval: 0,
            mayShowUserSettingsDialog: true,
          });

          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error(`タイムアウト (${level.timeout}ms)`)), level.timeout);
          });

          const location = await Promise.race([locationPromise, timeoutPromise]);
          
          console.log(`LocationStore: 精度[${level.name}]で位置情報取得成功`, {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy
          });

          set({ 
            location, 
            isLoading: false, 
            isInitialized: true,
            errorMsg: null 
          });
          
          return; // 成功したら即座に終了
        } catch (error) {
          console.warn(`LocationStore: 精度[${level.name}]での取得失敗:`, error);
          lastError = error as Error;
          continue; // 次の精度レベルで再試行
        }
      }

      // すべての試行が失敗した場合
      throw lastError || new Error('すべての精度レベルで位置情報の取得に失敗しました');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '位置情報の取得に失敗しました';
      console.error('LocationStore: 最終的なエラー:', errorMessage);
      
      set({ 
        errorMsg: errorMessage,
        isLoading: false,
        isInitialized: true
      });
    }
  },

  refreshLocation: async () => {
    console.log('LocationStore: 位置情報を更新');
    const store = get();
    
    // リセットしてから再初期化
    set({
      location: null,
      errorMsg: null,
      isLoading: true,
      isInitialized: false
    });
    
    await store.initializeLocation();
  },

  reset: () => {
    console.log('LocationStore: リセット');
    set({
      location: null,
      errorMsg: null,
      isLoading: false,
      isInitialized: false
    });
  }
}));