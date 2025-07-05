import { useState, useEffect, useCallback } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { Coordinate } from '../types/maps';

interface LocationState {
  location: Coordinate | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean;
}

interface UseLocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchPosition?: boolean;
}

export const useLocation = (options: UseLocationOptions = {}) => {
  const [state, setState] = useState<LocationState>({
    location: null,
    isLoading: false,
    error: null,
    hasPermission: false,
  });

  const {
    enableHighAccuracy = true,
    timeout = 15000,
    maximumAge = 10000,
    watchPosition = false,
  } = options;

  // 位置情報の権限をリクエスト
  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: '位置情報の許可',
            message: 'yotasが位置情報にアクセスすることを許可してください。',
            buttonNeutral: '後で',
            buttonNegative: 'キャンセル',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        // iOSの場合、Info.plistの設定により自動で権限ダイアログが表示される
        return true;
      }
    } catch (error) {
      console.error('Location permission error:', error);
      return false;
    }
  }, []);

  // 現在位置を取得
  const getCurrentLocation = useCallback(async (): Promise<Coordinate | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const hasPermission = await requestLocationPermission();

      if (!hasPermission) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: '位置情報の許可が必要です',
          hasPermission: false,
        }));
        return null;
      }

      setState(prev => ({ ...prev, hasPermission: true }));

      return new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          position => {
            const location: Coordinate = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };

            setState(prev => ({
              ...prev,
              location,
              isLoading: false,
              error: null,
            }));

            resolve(location);
          },
          error => {
            console.error('Geolocation error:', error);
            let errorMessage = '位置情報の取得に失敗しました';

            switch (error.code) {
              case 1:
                errorMessage = '位置情報の許可が拒否されました';
                break;
              case 2:
                errorMessage = '位置情報が利用できません';
                break;
              case 3:
                errorMessage = '位置情報の取得がタイムアウトしました';
                break;
            }

            setState(prev => ({
              ...prev,
              isLoading: false,
              error: errorMessage,
            }));

            reject(new Error(errorMessage));
          },
          {
            enableHighAccuracy,
            timeout,
            maximumAge,
          },
        );
      });
    } catch (error) {
      const errorMessage = '位置情報の取得に失敗しました';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return null;
    }
  }, [requestLocationPermission, enableHighAccuracy, timeout, maximumAge]);

  // 位置情報の監視を開始
  const startWatching = useCallback(() => {
    if (!state.hasPermission) {
      getCurrentLocation();
      return;
    }

    const watchId = Geolocation.watchPosition(
      position => {
        const location: Coordinate = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setState(prev => ({
          ...prev,
          location,
          error: null,
        }));
      },
      error => {
        console.error('Watch position error:', error);
        setState(prev => ({
          ...prev,
          error: '位置情報の監視に失敗しました',
        }));
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
        distanceFilter: 10, // 10メートル移動したら更新
      },
    );

    return () => Geolocation.clearWatch(watchId);
  }, [state.hasPermission, getCurrentLocation, enableHighAccuracy, timeout, maximumAge]);

  // エラーをクリア
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // 権限確認とエラーハンドリング
  const showLocationError = useCallback(() => {
    if (state.error) {
      Alert.alert('位置情報エラー', state.error, [
        { text: 'OK', onPress: clearError },
        { text: '再試行', onPress: getCurrentLocation },
      ]);
    }
  }, [state.error, clearError, getCurrentLocation]);

  // 初期化時に権限をチェック
  useEffect(() => {
    if (Platform.OS === 'android') {
      PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION).then(
        granted => {
          setState(prev => ({ ...prev, hasPermission: granted }));
        },
      );
    } else {
      setState(prev => ({ ...prev, hasPermission: true }));
    }
  }, []);

  // watchPositionが有効な場合、自動で監視を開始
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    if (watchPosition && state.hasPermission) {
      cleanup = startWatching();
    }

    return cleanup;
  }, [watchPosition, state.hasPermission, startWatching]);

  return {
    location: state.location,
    isLoading: state.isLoading,
    error: state.error,
    hasPermission: state.hasPermission,
    getCurrentLocation,
    startWatching,
    clearError,
    showLocationError,
  };
};
