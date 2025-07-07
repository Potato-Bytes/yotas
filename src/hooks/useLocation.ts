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
    enableHighAccuracy = false, // 初回は速度優先
    timeout = 30000, // 30秒に延長
    maximumAge = 60000, // 1分のキャッシュを許可
    watchPosition = false,
  } = options;

  // 位置情報の権限をリクエスト
  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        // まず現在の権限状況をチェック
        const fineLocationCheck = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        
        if (fineLocationCheck) {
          return true;
        }

        // 権限がない場合、リクエスト
        const fineLocationRequest = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: '位置情報の許可',
            message: 'yotasが現在位置を取得するために位置情報の許可が必要です。',
            buttonNeutral: '後で',
            buttonNegative: 'キャンセル',
            buttonPositive: 'OK',
          },
        );

        if (fineLocationRequest === PermissionsAndroid.RESULTS.GRANTED) {
          return true;
        }

        // FINE_LOCATIONが拒否された場合、COARSE_LOCATIONを試す
        const coarseLocationRequest = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
          {
            title: 'おおよその位置情報の許可',
            message: 'おおよその位置情報の許可でも機能します。',
            buttonNeutral: '後で',
            buttonNegative: 'キャンセル',
            buttonPositive: 'OK',
          },
        );

        return coarseLocationRequest === PermissionsAndroid.RESULTS.GRANTED;
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
        // まずGeolocationがAndroidで正しく動作するように設定
        if (Platform.OS === 'android') {
          Geolocation.setRNConfiguration({
            skipPermissionRequests: false,
            authorizationLevel: 'whenInUse',
            enableBackgroundLocationUpdates: false,
            locationProvider: 'android'
          });
        }

        // 最初は低精度で素早く取得を試みる
        const tryGetLocation = (highAccuracy: boolean, timeoutMs: number) => {
          return new Promise<Coordinate>((resolveInner, rejectInner) => {
            Geolocation.getCurrentPosition(
              position => {
                const location: Coordinate = {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                };
                resolveInner(location);
              },
              error => rejectInner(error),
              {
                enableHighAccuracy: highAccuracy,
                timeout: timeoutMs,
                maximumAge: maximumAge
              }
            );
          });
        };

        // 段階的に精度を上げて試行
        const attemptLocation = async () => {
          try {
            // 1回目: 低精度で素早く(10秒)
            console.log('位置取得試行 1: 低精度モード');
            const location = await tryGetLocation(false, 10000);
            return location;
          } catch (error1) {
            console.log('低精度で失敗、高精度で再試行');
            try {
              // 2回目: 高精度で再試行(20秒)
              console.log('位置取得試行 2: 高精度モード');
              const location = await tryGetLocation(true, 20000);
              return location;
            } catch (error2) {
              console.log('高精度でも失敗、最終試行');
              try {
                // 3回目: キャッシュを使用して最終試行(5秒)
                console.log('位置取得試行 3: キャッシュ使用');
                const location = await tryGetLocation(false, 5000);
                return location;
              } catch (error3) {
                // すべての試行が失敗
                throw error3;
              }
            }
          }
        };

        attemptLocation()
          .then(location => {
            setState(prev => ({
              ...prev,
              location,
              isLoading: false,
              error: null,
            }));
            resolve(location);
          })
          .catch(error => {
            console.error('Geolocation error details:', {
              code: error.code,
              message: error.message,
              PERMISSION_DENIED: error.PERMISSION_DENIED,
              POSITION_UNAVAILABLE: error.POSITION_UNAVAILABLE,
              TIMEOUT: error.TIMEOUT
            });
            
            let errorMessage = '位置情報の取得に失敗しました';

            switch (error.code) {
              case 1: // PERMISSION_DENIED
                errorMessage = '位置情報の許可が拒否されました。設定から許可してください。';
                break;
              case 2: // POSITION_UNAVAILABLE
                errorMessage = '位置情報サービスが利用できません。GPSを有効にしてください。';
                break;
              case 3: // TIMEOUT
                errorMessage = '位置情報の取得がタイムアウトしました。屋外で再試行してください。';
                break;
              default:
                errorMessage = `位置情報エラー: ${error.message || '未知のエラー'}`;
            }

            setState(prev => ({
              ...prev,
              isLoading: false,
              error: errorMessage,
            }));

            reject(new Error(errorMessage));
          });
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
