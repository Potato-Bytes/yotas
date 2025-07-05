import { useEffect, useState } from 'react';
import Geolocation from '@react-native-community/geolocation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';

// Location hook
export const useLocation = () => {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('位置情報の取得を開始...');
    
    // より寛容な設定で位置情報を取得
    Geolocation.getCurrentPosition(
      position => {
        console.log('位置情報取得成功:', position.coords);
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setError(null);
        setLoading(false);
      },
      positionError => {
        console.error('位置情報取得エラー:', positionError);
        console.error('エラーコード:', positionError.code);
        console.error('エラーメッセージ:', positionError.message);
        
        // デフォルトの位置情報（東京駅）を設定
        console.log('デフォルト位置情報を使用: 東京駅');
        setLocation({
          latitude: 35.6812,
          longitude: 139.7671,
        });
        setError('位置情報の取得に失敗したため、デフォルト位置（東京駅）を使用しています');
        setLoading(false);
      },
      { 
        enableHighAccuracy: false, // 精度を下げて速度を上げる
        timeout: 30000, // タイムアウトを30秒に延長
        maximumAge: 300000 // キャッシュを5分間有効にする
      },
    );
  }, []);

  return { location, error, loading };
};

// Reviews hooks
export const useReviews = (params?: { limit?: number; offset?: number }) =>
  useQuery({
    queryKey: ['reviews', params],
    queryFn: () => apiService.getReviews(params),
  });

export const useReviewsByPlace = (placeId: string) =>
  useQuery({
    queryKey: ['reviews', 'place', placeId],
    queryFn: () => apiService.getReviewsByPlace(placeId),
    enabled: !!placeId,
  });

export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (review: { placeId: string; rating: number; comment: string; photos?: string[] }) =>
      apiService.createReview(review),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
};

// Places hooks
export const useSearchPlaces = (query: string, location?: { lat: number; lng: number }) =>
  useQuery({
    queryKey: ['places', 'search', query, location],
    queryFn: () => apiService.searchPlaces(query, location),
    enabled: !!query,
  });

export const useNearbyPlaces = (location: { lat: number; lng: number }, radius = 1000) =>
  useQuery({
    queryKey: ['places', 'nearby', location, radius],
    queryFn: () => apiService.getNearbyPlaces(location, radius),
    enabled: !!location,
  });
