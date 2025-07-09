import { create } from 'zustand';
import Geolocation, {
  GeoOptions,
  GeoError,
  GeoPosition,
} from 'react-native-geolocation-service';
import { PermissionsAndroid, Platform } from 'react-native';

type LocationCoords = { latitude: number; longitude: number; accuracy?: number };

// デバッグ用ログ関数
const log = (...args: any[]) => console.log('[LocationStore]', ...args);

interface State {
  location: LocationCoords | null;
  errorMsg: string | null;
  isLoading: boolean;
  watchId: number | null;
  initializeLocation: () => Promise<void>;
  refresh: () => Promise<void>;
  stop: () => void;
  reset: () => void;
}

export const useLocationStore = create<State>((set, get) => ({
  location: null,
  errorMsg: null,
  isLoading: false,
  watchId: null,

  initializeLocation: async () => {
    log('initializeLocation開始');
    set({ isLoading: true, errorMsg: null });

    try {
      // ---- 1. 権限リクエスト ----
      log('権限リクエスト開始');
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        log('Android権限結果:', granted);
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          throw new Error('位置情報の権限が拒否されました');
        }
      } else {
        const iosAuth = await Geolocation.requestAuthorization('whenInUse');
        log('iOS権限結果:', iosAuth);
        if (iosAuth !== 'granted') throw new Error('位置情報の権限が拒否されました');
      }

      // ---- 2. 最初の位置情報を即座に取得 ----
      log('getCurrentPosition開始');
      try {
        const initialPos = await new Promise<GeoPosition>((resolve, reject) => {
          Geolocation.getCurrentPosition(
            resolve,
            reject,
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
          );
        });
        const { latitude, longitude, accuracy } = initialPos.coords;
        log('初期位置取得成功:', { latitude, longitude, accuracy });
        set({ location: { latitude, longitude, accuracy }, isLoading: false });
      } catch (e) {
        log('初期位置取得失敗:', e);
        // 初期位置取得に失敗してもwatchPositionは開始する
      }

      // ---- 3. watchPosition でリアルタイム位置情報取得 ----
      const opts: GeoOptions = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
        distanceFilter: 20,  // 20m移動したら更新
        interval: 4000,      // 4秒間隔で更新
      };

      // 既にwatchingしている場合は停止
      const currentWatchId = get().watchId;
      if (currentWatchId !== null) {
        log('既存のwatchをクリア:', currentWatchId);
        Geolocation.clearWatch(currentWatchId);
      }

      // watchPositionを開始
      log('watchPosition開始');
      const watchId = Geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          log('OK - 位置情報更新:', { latitude, longitude, accuracy });
          set({ location: { latitude, longitude, accuracy }, isLoading: false });
        },
        (err: GeoError) => {
          log('ERR', err.code, err.message);
          set({ errorMsg: err.message, isLoading: false });
          // エラーが発生した場合はwatchを停止して無限ループを防ぐ
          const id = get().watchId;
          if (id !== null && err.code === 2) { // POSITION_UNAVAILABLE
            log('位置情報プロバイダー利用不可のためwatch停止');
            Geolocation.clearWatch(id);
            set({ watchId: null });
          }
        },
        opts,
      );

      log('watchId設定:', watchId);
      set({ watchId, isLoading: false });
    } catch (e) {
      log('LocationStore error:', e);
      set({ errorMsg: (e as Error).message, isLoading: false });
    }
  },

  refresh: async () => {
    set({ location: null });
    await (useLocationStore.getState().initializeLocation());
  },

  stop: () => {
    const { watchId } = get();
    if (watchId !== null) {
      Geolocation.clearWatch(watchId);
      set({ watchId: null });
      log('位置情報のwatchingを停止');
    }
  },

  reset: () => {
    const { stop } = get();
    stop();
    set({ location: null, errorMsg: null, isLoading: false });
  },
}));