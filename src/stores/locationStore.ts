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
  initializeLocation: () => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
}

export const useLocationStore = create<State>((set) => ({
  location: null,
  errorMsg: null,
  isLoading: false,

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

      // ---- 2. 位置情報取得 ----
      const opts: GeoOptions = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      };

      await new Promise<GeoPosition>((resolve, reject) => {
        Geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude, accuracy } = pos.coords;
            set({ location: { latitude, longitude, accuracy }, isLoading: false });
            resolve(pos);
          },
          (err: GeoError) => reject(new Error(err.message)),
          opts,
        );
      });
    } catch (e) {
      set({ errorMsg: (e as Error).message, isLoading: false });
      console.warn('LocationStore error:', e);
    }
  },

  refresh: async () => {
    set({ location: null });
    await (useLocationStore.getState().initializeLocation());
  },

  reset: () => set({ location: null, errorMsg: null, isLoading: false }),
}));