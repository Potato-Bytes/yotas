import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';
import { Platform, PermissionsAndroid } from 'react-native';
import { PushNotification, NotificationSettings, PushToken, NotificationType } from '../types/post';

export class NotificationService {
  private notificationsCollection = firestore().collection('push_notifications');
  private settingsCollection = firestore().collection('notification_settings');
  private tokensCollection = firestore().collection('push_tokens');

  /**
   * プッシュ通知の初期化
   */
  async initialize(userId: string): Promise<void> {
    try {
      // 通知権限の確認・リクエスト
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log('Push notification permission denied');
        return;
      }

      // Android 13以降の追加権限確認
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Android notification permission denied');
          return;
        }
      }

      // FCMトークンの取得・保存
      const token = await messaging().getToken();
      await this.savePushToken(userId, token);

      // トークン更新の監視
      messaging().onTokenRefresh(async newToken => {
        await this.savePushToken(userId, newToken);
      });

      // フォアグラウンド通知の設定
      messaging().onMessage(async remoteMessage => {
        await this.handleForegroundMessage(remoteMessage);
      });

      // バックグラウンド通知の設定（index.jsで設定済みのはず）
      messaging().onNotificationOpenedApp(remoteMessage => {
        this.handleNotificationOpen(remoteMessage);
      });

      // アプリ起動時の通知チェック
      messaging()
        .getInitialNotification()
        .then(remoteMessage => {
          if (remoteMessage) {
            this.handleNotificationOpen(remoteMessage);
          }
        });
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  }

  /**
   * プッシュトークンの保存
   */
  async savePushToken(userId: string, token: string): Promise<void> {
    try {
      const tokenData: PushToken = {
        userId,
        token,
        platform: Platform.OS as 'ios' | 'android',
        isActive: true,
        lastUsed: new Date(),
        createdAt: new Date(),
      };

      // 既存のトークンを無効化
      await this.tokensCollection
        .where('userId', '==', userId)
        .where('platform', '==', Platform.OS)
        .get()
        .then(snapshot => {
          const batch = firestore().batch();
          snapshot.docs.forEach(doc => {
            batch.update(doc.ref, { isActive: false });
          });
          return batch.commit();
        });

      // 新しいトークンを保存
      await this.tokensCollection.add({
        ...tokenData,
        lastUsed: firestore.Timestamp.now(),
        createdAt: firestore.Timestamp.now(),
      });
    } catch (error) {
      console.error('Failed to save push token:', error);
    }
  }

  /**
   * 通知設定の取得
   */
  async getNotificationSettings(userId: string): Promise<NotificationSettings> {
    try {
      const doc = await this.settingsCollection.doc(userId).get();

      if (!doc.exists) {
        // デフォルト設定を作成
        const defaultSettings: NotificationSettings = {
          userId,
          enabled: true,
          badgeNotifications: true,
          helpfulVoteNotifications: true,
          nearbyToiletNotifications: true,
          updateNotifications: true,
          newsNotifications: true,
          summaryNotifications: false,
          reminderNotifications: true,
          quietHoursEnabled: false,
          quietHoursStart: '22:00',
          quietHoursEnd: '08:00',
          updatedAt: new Date(),
        };

        await this.settingsCollection.doc(userId).set({
          ...defaultSettings,
          updatedAt: firestore.Timestamp.now(),
        });

        return defaultSettings;
      }

      const data = doc.data()!;
      return {
        ...data,
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as NotificationSettings;
    } catch (error) {
      console.error('Failed to get notification settings:', error);
      throw new Error('通知設定の取得に失敗しました');
    }
  }

  /**
   * 通知設定の更新
   */
  async updateNotificationSettings(
    userId: string,
    updates: Partial<NotificationSettings>,
  ): Promise<void> {
    try {
      await this.settingsCollection.doc(userId).update({
        ...updates,
        updatedAt: firestore.Timestamp.now(),
      });
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      throw new Error('通知設定の更新に失敗しました');
    }
  }

  /**
   * 通知の送信（サーバーサイド用）
   */
  async sendNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    try {
      // 通知設定をチェック
      const settings = await this.getNotificationSettings(userId);
      if (!settings.enabled || !this.shouldSendNotification(type, settings)) {
        return;
      }

      // サイレント時間のチェック
      if (this.isInQuietHours(settings)) {
        return;
      }

      // 通知データを保存
      const notification: PushNotification = {
        id: firestore().collection('push_notifications').doc().id,
        userId,
        type,
        title,
        body,
        data,
        isRead: false,
        createdAt: new Date(),
      };

      await this.notificationsCollection.add({
        ...notification,
        createdAt: firestore.Timestamp.now(),
      });

      // 実際のプッシュ通知送信（Cloud Functionsで処理）
      // ここではローカル通知として表示
      this.showLocalNotification(title, body, data);
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  /**
   * ユーザーの通知履歴を取得
   */
  async getUserNotifications(userId: string, limit: number = 20): Promise<PushNotification[]> {
    try {
      const snapshot = await this.notificationsCollection
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      const notifications: PushNotification[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          userId: data.userId,
          type: data.type,
          title: data.title,
          body: data.body,
          data: data.data,
          isRead: data.isRead,
          createdAt: data.createdAt.toDate(),
          scheduledAt: data.scheduledAt?.toDate(),
        });
      });

      return notifications;
    } catch (error) {
      console.error('Failed to get user notifications:', error);
      return [];
    }
  }

  /**
   * 通知を既読にする
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await this.notificationsCollection.doc(notificationId).update({
        isRead: true,
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  /**
   * 全通知を既読にする
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const snapshot = await this.notificationsCollection
        .where('userId', '==', userId)
        .where('isRead', '==', false)
        .get();

      const batch = firestore().batch();
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { isRead: true });
      });

      await batch.commit();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }

  /**
   * 未読通知数の取得
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const snapshot = await this.notificationsCollection
        .where('userId', '==', userId)
        .where('isRead', '==', false)
        .get();

      return snapshot.size;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }

  /**
   * 特定のタイプの通知を送信すべきかチェック
   */
  private shouldSendNotification(type: NotificationType, settings: NotificationSettings): boolean {
    switch (type) {
      case NotificationType.BADGE_UNLOCKED:
        return settings.badgeNotifications;
      case NotificationType.HELPFUL_VOTE:
        return settings.helpfulVoteNotifications;
      case NotificationType.NEW_TOILET_NEARBY:
        return settings.nearbyToiletNotifications;
      case NotificationType.TOILET_UPDATED:
        return settings.updateNotifications;
      case NotificationType.COMMUNITY_NEWS:
        return settings.newsNotifications;
      case NotificationType.WEEKLY_SUMMARY:
        return settings.summaryNotifications;
      case NotificationType.ACHIEVEMENT_REMINDER:
        return settings.reminderNotifications;
      default:
        return true;
    }
  }

  /**
   * サイレント時間かどうかチェック
   */
  private isInQuietHours(settings: NotificationSettings): boolean {
    if (!settings.quietHoursEnabled) {
      return false;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    const start = settings.quietHoursStart;
    const end = settings.quietHoursEnd;

    // 日をまたぐ場合（例: 22:00 - 08:00）
    if (start > end) {
      return currentTime >= start || currentTime <= end;
    }
    // 同日内の場合（例: 08:00 - 22:00）
    else {
      return currentTime >= start && currentTime <= end;
    }
  }

  /**
   * フォアグラウンド通知の処理
   */
  private async handleForegroundMessage(remoteMessage: any): Promise<void> {
    // フォアグラウンドでもローカル通知を表示
    if (remoteMessage.notification) {
      this.showLocalNotification(
        remoteMessage.notification.title,
        remoteMessage.notification.body,
        remoteMessage.data,
      );
    }
  }

  /**
   * 通知タップ時の処理
   */
  private handleNotificationOpen(remoteMessage: any): void {
    console.log('Notification opened:', remoteMessage);

    // データに基づいて画面遷移を行う
    if (remoteMessage.data) {
      const { screen, toiletId, badgeId } = remoteMessage.data;

      // ナビゲーション処理（実装は簡略化）
      switch (screen) {
        case 'ToiletDetail':
          console.log('Navigate to toilet detail:', toiletId);
          break;
        case 'BadgeScreen':
          console.log('Navigate to badge screen:', badgeId);
          break;
        default:
          console.log('Navigate to home screen');
      }
    }
  }

  /**
   * ローカル通知の表示（デモ用）
   */
  private showLocalNotification(title: string, body: string, data?: Record<string, any>): void {
    // 実際の実装では react-native-push-notification などを使用
    console.log('Local notification:', { title, body, data });
  }

  /**
   * バッジ取得通知
   */
  async sendBadgeUnlockedNotification(
    userId: string,
    badgeName: string,
    badgeId: string,
  ): Promise<void> {
    await this.sendNotification(
      userId,
      NotificationType.BADGE_UNLOCKED,
      '🎉 新しいバッジを取得！',
      `「${badgeName}」バッジを取得しました`,
      { screen: 'BadgeScreen', badgeId },
    );
  }

  /**
   * 「役に立った」投票通知
   */
  async sendHelpfulVoteNotification(
    userId: string,
    toiletTitle: string,
    toiletId: string,
  ): Promise<void> {
    await this.sendNotification(
      userId,
      NotificationType.HELPFUL_VOTE,
      '👍 役に立ったと評価されました',
      `「${toiletTitle}」の投稿が役に立ったと評価されました`,
      { screen: 'ToiletDetail', toiletId },
    );
  }

  /**
   * 近くの新しいトイレ通知
   */
  async sendNearbyToiletNotification(
    userId: string,
    toiletTitle: string,
    toiletId: string,
  ): Promise<void> {
    await this.sendNotification(
      userId,
      NotificationType.NEW_TOILET_NEARBY,
      '🚻 近くに新しいトイレが追加されました',
      `「${toiletTitle}」があなたの近くに追加されました`,
      { screen: 'ToiletDetail', toiletId },
    );
  }
}

// シングルトンインスタンス
export const notificationService = new NotificationService();
