import { create } from 'zustand';
import Geolocation, {
  GeoOptions,
  GeoError,
  GeoPosition,
} from 'react-native-geolocation-service';
import { PermissionsAndroid, Platform } from 'react-native';

type LocationCoords = { latitude: number; longitude: number; accuracy?: number };

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
    set({ isLoading: true, errorMsg: null });

    try {
      // ---- 1. 権限リクエスト ----
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          throw new Error('位置情報の権限が拒否されました');
        }
      } else {
        const iosAuth = await Geolocation.requestAuthorization('whenInUse');
        if (iosAuth !== 'granted') throw new Error('位置情報の権限が拒否されました');
      }

      // ---- 2. watchPosition でリアルタイム位置情報取得 ----
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
        Geolocation.clearWatch(currentWatchId);
      }

      // watchPositionを開始
      const watchId = Geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          set({ location: { latitude, longitude, accuracy }, isLoading: false });
          console.log('位置情報更新:', { latitude, longitude, accuracy });
        },
        (err: GeoError) => {
          set({ errorMsg: err.message, isLoading: false });
          console.warn('位置情報取得エラー:', err);
        },
        opts,
      );

      set({ watchId, isLoading: false });
    } catch (e) {
      set({ errorMsg: (e as Error).message, isLoading: false });
      console.warn('LocationStore error:', e);
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
      console.log('位置情報のwatchingを停止');
    }
  },

  reset: () => {
    const { stop } = get();
    stop();
    set({ location: null, errorMsg: null, isLoading: false });
  },
}));