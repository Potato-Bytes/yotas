import { useState, useCallback, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { PushNotification, NotificationSettings } from '../types/post';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../stores/authStore';

interface UseNotificationsState {
  notifications: PushNotification[];
  settings: NotificationSettings | null;
  unreadCount: number;
  isLoading: boolean;
  isInitialized: boolean;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [state, setState] = useState<UseNotificationsState>({
    notifications: [],
    settings: null,
    unreadCount: 0,
    isLoading: false,
    isInitialized: false,
  });

  // 通知システムの初期化
  const initializeNotifications = useCallback(async () => {
    if (!user || state.isInitialized) return;

    try {
      await notificationService.initialize(user.uid);
      setState(prev => ({ ...prev, isInitialized: true }));

      // 初期データの読み込み（個別に実行して依存関係の問題を回避）
      try {
        const [notifications, unreadCount] = await Promise.all([
          notificationService.getUserNotifications(user.uid),
          notificationService.getUnreadCount(user.uid)
        ]);
        setState(prev => ({ ...prev, notifications, unreadCount }));
      } catch (error) {
        console.error('Failed to load initial notification data:', error);
      }
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  }, [user, state.isInitialized]);

  // 通知履歴の読み込み
  const loadNotifications = useCallback(async () => {
    if (!user) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const notifications = await notificationService.getUserNotifications(user.uid);
      setState(prev => ({
        ...prev,
        notifications,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [user]);

  // 通知設定の読み込み
  const loadSettings = useCallback(async () => {
    if (!user) return;

    try {
      const settings = await notificationService.getNotificationSettings(user.uid);
      setState(prev => ({ ...prev, settings }));
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  }, [user]);

  // 未読数の読み込み
  const loadUnreadCount = useCallback(async () => {
    if (!user) return;

    try {
      const unreadCount = await notificationService.getUnreadCount(user.uid);
      setState(prev => ({ ...prev, unreadCount }));
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  }, [user]);

  // 通知設定の更新
  const updateSettings = useCallback(
    async (updates: Partial<NotificationSettings>) => {
      if (!user) return;

      try {
        await notificationService.updateNotificationSettings(user.uid, updates);
        setState(prev => ({
          ...prev,
          settings: prev.settings ? { ...prev.settings, ...updates } : null,
        }));
      } catch (error) {
        console.error('Failed to update notification settings:', error);
        throw error;
      }
    },
    [user],
  );

  // 通知を既読にする
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);

      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(notification =>
          notification.id === notificationId ? { ...notification, isRead: true } : notification,
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1),
      }));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  // 全通知を既読にする
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      await notificationService.markAllAsRead(user.uid);

      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(notification => ({
          ...notification,
          isRead: true,
        })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [user]);

  // 通知の手動送信（デバッグ用）
  const sendTestNotification = useCallback(
    async (title: string, body: string) => {
      if (!user) return;

      try {
        await notificationService.sendNotification(user.uid, 'community_news' as any, title, body);

        // 通知履歴を再読み込み
        setTimeout(() => {
          loadNotifications();
          loadUnreadCount();
        }, 1000);
      } catch (error) {
        console.error('Failed to send test notification:', error);
      }
    },
    [user, loadNotifications, loadUnreadCount],
  );

  // バッジ取得通知
  const sendBadgeNotification = useCallback(
    async (badgeName: string, badgeId: string) => {
      if (!user) return;

      try {
        await notificationService.sendBadgeUnlockedNotification(user.uid, badgeName, badgeId);

        // 通知履歴を更新
        setTimeout(() => {
          loadNotifications();
          loadUnreadCount();
        }, 500);
      } catch (error) {
        console.error('Failed to send badge notification:', error);
      }
    },
    [user, loadNotifications, loadUnreadCount],
  );

  // 「役に立った」通知
  const sendHelpfulVoteNotification = useCallback(
    async (toiletTitle: string, toiletId: string) => {
      if (!user) return;

      try {
        await notificationService.sendHelpfulVoteNotification(user.uid, toiletTitle, toiletId);

        // 通知履歴を更新
        setTimeout(() => {
          loadNotifications();
          loadUnreadCount();
        }, 500);
      } catch (error) {
        console.error('Failed to send helpful vote notification:', error);
      }
    },
    [user, loadNotifications, loadUnreadCount],
  );

  // アプリ状態変更の監視
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && user) {
        // アプリがアクティブになったら未読数を更新
        loadUnreadCount();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [user, loadUnreadCount]);

  // 初期化
  useEffect(() => {
    if (user && !state.isInitialized) {
      initializeNotifications();
    }
  }, [user, state.isInitialized, initializeNotifications]);

  // 定期的な未読数更新
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      loadUnreadCount();
    }, 60000); // 1分ごと

    return () => clearInterval(interval);
  }, [user, loadUnreadCount]);

  return {
    // 状態
    notifications: state.notifications,
    settings: state.settings,
    unreadCount: state.unreadCount,
    isLoading: state.isLoading,
    isInitialized: state.isInitialized,

    // アクション
    loadNotifications,
    loadSettings,
    updateSettings,
    markAsRead,
    markAllAsRead,
    sendTestNotification,
    sendBadgeNotification,
    sendHelpfulVoteNotification,
    refresh: () => Promise.all([loadNotifications(), loadSettings(), loadUnreadCount()]),
  };
};
