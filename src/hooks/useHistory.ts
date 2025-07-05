import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { ViewHistory, Favorite, UserActivity, UserStats } from '../types/post';
import { ToiletLocation } from '../types/maps';
import { historyService } from '../services/historyService';
import { useAuth } from '../stores/authStore';

interface UseHistoryState {
  viewHistory: ViewHistory[];
  favorites: Favorite[];
  activities: UserActivity[];
  userStats: UserStats | null;
  isLoading: boolean;
  isUpdating: boolean;
}

export const useHistory = () => {
  const { user } = useAuth();
  const [state, setState] = useState<UseHistoryState>({
    viewHistory: [],
    favorites: [],
    activities: [],
    userStats: null,
    isLoading: false,
    isUpdating: false,
  });

  // 閲覧履歴を記録
  const recordView = useCallback(
    async (toilet: ToiletLocation) => {
      if (!user) return;

      try {
        await historyService.recordView(user.uid, toilet);
        // 履歴を再読み込み（バックグラウンドで）
        loadViewHistory();
      } catch (error) {
        console.error('Failed to record view:', error);
      }
    },
    [user],
  );

  // 閲覧履歴を読み込み
  const loadViewHistory = useCallback(async () => {
    if (!user) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const history = await historyService.getViewHistory(user.uid);
      setState(prev => ({
        ...prev,
        viewHistory: history,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to load view history:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [user]);

  // 閲覧履歴をクリア
  const clearViewHistory = useCallback(async () => {
    if (!user) return;

    Alert.alert('履歴を削除', '閲覧履歴をすべて削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          setState(prev => ({ ...prev, isUpdating: true }));
          try {
            await historyService.clearViewHistory(user.uid);
            setState(prev => ({
              ...prev,
              viewHistory: [],
              isUpdating: false,
            }));
            Alert.alert('完了', '履歴を削除しました');
          } catch (error) {
            console.error('Failed to clear view history:', error);
            Alert.alert('エラー', '履歴の削除に失敗しました');
            setState(prev => ({ ...prev, isUpdating: false }));
          }
        },
      },
    ]);
  }, [user]);

  // お気に入りを読み込み
  const loadFavorites = useCallback(async () => {
    if (!user) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const favorites = await historyService.getFavorites(user.uid);
      setState(prev => ({
        ...prev,
        favorites,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to load favorites:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [user]);

  // お気に入りに追加
  const addToFavorites = useCallback(
    async (toilet: ToiletLocation) => {
      if (!user) return;

      setState(prev => ({ ...prev, isUpdating: true }));

      try {
        await historyService.addToFavorites(user.uid, toilet);

        // お気に入り一覧を更新
        await loadFavorites();

        setState(prev => ({ ...prev, isUpdating: false }));
        Alert.alert('追加完了', 'お気に入りに追加しました');
      } catch (error) {
        console.error('Failed to add to favorites:', error);
        setState(prev => ({ ...prev, isUpdating: false }));

        if (error instanceof Error) {
          Alert.alert('エラー', error.message);
        } else {
          Alert.alert('エラー', 'お気に入りの追加に失敗しました');
        }
      }
    },
    [user, loadFavorites],
  );

  // お気に入りから削除
  const removeFromFavorites = useCallback(
    async (toiletId: string) => {
      if (!user) return;

      setState(prev => ({ ...prev, isUpdating: true }));

      try {
        await historyService.removeFromFavorites(user.uid, toiletId);

        // お気に入り一覧を更新
        setState(prev => ({
          ...prev,
          favorites: prev.favorites.filter(fav => fav.toiletId !== toiletId),
          isUpdating: false,
        }));

        Alert.alert('削除完了', 'お気に入りから削除しました');
      } catch (error) {
        console.error('Failed to remove from favorites:', error);
        setState(prev => ({ ...prev, isUpdating: false }));
        Alert.alert('エラー', 'お気に入りの削除に失敗しました');
      }
    },
    [user],
  );

  // お気に入りかどうかチェック
  const isFavorite = useCallback(
    (toiletId: string): boolean => state.favorites.some(fav => fav.toiletId === toiletId),
    [state.favorites],
  );

  // お気に入りのトグル
  const toggleFavorite = useCallback(
    async (toilet: ToiletLocation) => {
      if (isFavorite(toilet.id)) {
        await removeFromFavorites(toilet.id);
      } else {
        await addToFavorites(toilet);
      }
    },
    [isFavorite, removeFromFavorites, addToFavorites],
  );

  // アクティビティを読み込み
  const loadActivities = useCallback(async () => {
    if (!user) return;

    try {
      const activities = await historyService.getUserActivities(user.uid);
      setState(prev => ({ ...prev, activities }));
    } catch (error) {
      console.error('Failed to load activities:', error);
    }
  }, [user]);

  // ユーザー統計を読み込み
  const loadUserStats = useCallback(async () => {
    if (!user) return;

    try {
      const stats = await historyService.getUserStats(user.uid);
      setState(prev => ({ ...prev, userStats: stats }));
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  }, [user]);

  // よく見るトイレを取得
  const getFrequentlyViewed = useCallback(
    async (limit: number = 10): Promise<ViewHistory[]> => {
      if (!user) return [];

      try {
        return await historyService.getFrequentlyViewed(user.uid, limit);
      } catch (error) {
        console.error('Failed to get frequently viewed:', error);
        return [];
      }
    },
    [user],
  );

  // 最近のアクティビティを取得（全ユーザー）
  const getRecentActivities = useCallback(async (limit: number = 20): Promise<UserActivity[]> => {
    try {
      return await historyService.getRecentActivities(limit);
    } catch (error) {
      console.error('Failed to get recent activities:', error);
      return [];
    }
  }, []);

  // 全データの再読み込み
  const refresh = useCallback(async () => {
    if (!user) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      await Promise.all([loadViewHistory(), loadFavorites(), loadActivities(), loadUserStats()]);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [user, loadViewHistory, loadFavorites, loadActivities, loadUserStats]);

  // 初期データの読み込み
  useEffect(() => {
    if (user) {
      refresh();
    }
  }, [user, refresh]);

  // 統計の便利メソッド
  const getActivityCount = useCallback(
    (days: number = 7): number => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      return state.activities.filter(activity => activity.createdAt >= cutoffDate).length;
    },
    [state.activities],
  );

  const getViewCountToday = useCallback((): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return state.viewHistory.filter(view => view.viewedAt >= today).length;
  }, [state.viewHistory]);

  return {
    // 状態
    viewHistory: state.viewHistory,
    favorites: state.favorites,
    activities: state.activities,
    userStats: state.userStats,
    isLoading: state.isLoading,
    isUpdating: state.isUpdating,

    // アクション
    recordView,
    loadViewHistory,
    clearViewHistory,
    loadFavorites,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    loadActivities,
    loadUserStats,
    getFrequentlyViewed,
    getRecentActivities,
    refresh,

    // 計算値・ヘルパー
    isFavorite,
    favoriteCount: state.favorites.length,
    historyCount: state.viewHistory.length,
    activityCount: state.activities.length,
    getActivityCount,
    getViewCountToday,
    hasHistory: state.viewHistory.length > 0,
    hasFavorites: state.favorites.length > 0,
  };
};
