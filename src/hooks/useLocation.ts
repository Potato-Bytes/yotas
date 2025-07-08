import { useState, useEffect } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { Coordinate } from '../types/maps';

export const useLocation = () => {
  const [location, setLocation] = useState<Coordinate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const getLocation = async () => {
      console.log('useLocation: 位置情報取得開始');
      
      try {
        // 権限の確認（タイムアウト付き）
        let hasPermission = false;
        
        if (Platform.OS === 'android') {
          const permissionTimeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('権限確認タイムアウト')), 5000)
          );
          
          try {
            const permissionResult = await Promise.race([
              PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, {
                title: '位置情報の許可',
                message: 'yotasが現在位置を取得するために位置情報の許可が必要です。',
                buttonNeutral: '後で',
                buttonNegative: 'キャンセル',
                buttonPositive: 'OK',
              }),
              permissionTimeout
            ]);
            
            hasPermission = permissionResult === PermissionsAndroid.RESULTS.GRANTED;
          } catch (permErr) {
            console.log('useLocation: 権限確認でタイムアウト');
            hasPermission = false;
          }
        } else {
          // iOSの場合は権限確認をスキップ（Info.plistで設定済み）
          hasPermission = true;
        }
        
        if (!hasPermission) {
          console.log('useLocation: 位置情報権限が拒否されました');
          if (isMounted) {
            setError('位置情報へのアクセスが拒否されました。設定から権限を許可してください。');
            setIsLoading(false);
          }
          return;
        }

        console.log('useLocation: 権限確認完了、位置情報取得中...');

        // 位置情報の取得（複数の精度レベルで試行）
        const accuracyLevels = [
          { accuracy: false, timeout: 8000 },  // 低精度で速く
          { accuracy: true, timeout: 15000 },  // 高精度
          { accuracy: false, timeout: 5000 }   // 最後の試行
        ];

        for (let i = 0; i < accuracyLevels.length; i++) {
          const level = accuracyLevels[i];
          try {
            console.log(`useLocation: 精度レベル${i + 1}で位置情報取得試行中...`);
            
            const locationPromise = new Promise<Coordinate>((resolve, reject) => {
              Geolocation.getCurrentPosition(
                position => {
                  const locationData: Coordinate = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                  };
                  resolve(locationData);
                },
                err => reject(err),
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

            const currentLocation = await Promise.race([locationPromise, timeoutPromise]);

            if (currentLocation && isMounted) {
              console.log('useLocation: 位置情報取得成功', {
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                level: i + 1
              });
              setLocation(currentLocation);
              setIsLoading(false);
              return;
            }
          } catch (err) {
            console.log(`useLocation: 精度レベル${i + 1}での取得失敗:`, err);
            continue;
          }
        }

        // すべての試行が失敗した場合
        throw new Error('すべての精度レベルで位置情報の取得に失敗しました');

      } catch (locationError) {
        console.error('useLocation: エラー発生:', locationError);
        if (isMounted) {
          setError('現在地を取得できませんでした。GPS設定を確認してください。');
          setIsLoading(false);
        }
      }
    };

    getLocation();

    // クリーンアップ関数
    return () => {
      isMounted = false;
    };
  }, []);

  return { location, error, isLoading };
};
