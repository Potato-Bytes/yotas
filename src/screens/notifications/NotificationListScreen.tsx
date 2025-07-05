import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { PushNotification, NotificationType } from '../../types/post';
import { useNotifications } from '../../hooks/useNotifications';

interface NotificationItemProps {
  notification: PushNotification;
  onPress: (notification: PushNotification) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onPress }) => {
  const getNotificationIcon = (type: NotificationType): string => {
    switch (type) {
      case NotificationType.BADGE_UNLOCKED:
        return 'trophy';
      case NotificationType.HELPFUL_VOTE:
        return 'thumbs-up';
      case NotificationType.NEW_TOILET_NEARBY:
        return 'location';
      case NotificationType.TOILET_UPDATED:
        return 'refresh';
      case NotificationType.MAINTENANCE_ALERT:
        return 'warning';
      case NotificationType.COMMUNITY_NEWS:
        return 'newspaper';
      case NotificationType.WEEKLY_SUMMARY:
        return 'stats-chart';
      case NotificationType.ACHIEVEMENT_REMINDER:
        return 'alarm';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: NotificationType): string => {
    switch (type) {
      case NotificationType.BADGE_UNLOCKED:
        return '#FFD700';
      case NotificationType.HELPFUL_VOTE:
        return '#4CAF50';
      case NotificationType.NEW_TOILET_NEARBY:
        return '#2196F3';
      case NotificationType.TOILET_UPDATED:
        return '#FF9800';
      case NotificationType.MAINTENANCE_ALERT:
        return '#f44336';
      case NotificationType.COMMUNITY_NEWS:
        return '#9C27B0';
      case NotificationType.WEEKLY_SUMMARY:
        return '#607D8B';
      case NotificationType.ACHIEVEMENT_REMINDER:
        return '#3F51B5';
      default:
        return '#666';
    }
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes < 1 ? 'たった今' : `${diffMinutes}分前`;
    } else if (diffHours < 24) {
      return `${diffHours}時間前`;
    } else if (diffDays < 7) {
      return `${diffDays}日前`;
    } else {
      return date.toLocaleDateString('ja-JP', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  return (
    <TouchableOpacity
      style={[styles.notificationItem, !notification.isRead && styles.unreadItem]}
      onPress={() => onPress(notification)}
      activeOpacity={0.7}
    >
      {/* 通知アイコン */}
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: `${getNotificationColor(notification.type)}20` },
        ]}
      >
        <Icon
          name={getNotificationIcon(notification.type)}
          size={24}
          color={getNotificationColor(notification.type)}
        />
      </View>

      {/* 通知内容 */}
      <View style={styles.contentContainer}>
        <Text style={[styles.title, !notification.isRead && styles.unreadTitle]}>
          {notification.title}
        </Text>

        <Text style={styles.body} numberOfLines={2}>
          {notification.body}
        </Text>

        <Text style={styles.timestamp}>{formatDate(notification.createdAt)}</Text>
      </View>

      {/* 未読インジケーター */}
      {!notification.isRead && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  );
};

const NotificationListScreen: React.FC = () => {
  const { notifications, unreadCount, isLoading, loadNotifications, markAsRead, markAllAsRead } =
    useNotifications();

  // 通知アイテムをタップしたときの処理
  const handleNotificationPress = useCallback(
    async (notification: PushNotification) => {
      // 未読の場合は既読にする
      if (!notification.isRead) {
        await markAsRead(notification.id);
      }

      // 通知のデータに基づいて画面遷移
      if (notification.data) {
        const { screen, toiletId, badgeId } = notification.data;

        // 実際のナビゲーション処理（実装は簡略化）
        console.log('Navigate to:', { screen, toiletId, badgeId });

        // TODO: 実際のナビゲーション実装
        // navigation.navigate(screen, { toiletId, badgeId });
      }
    },
    [markAsRead],
  );

  // 全既読ボタンの処理
  const handleMarkAllAsRead = useCallback(async () => {
    if (unreadCount > 0) {
      await markAllAsRead();
    }
  }, [unreadCount, markAllAsRead]);

  // プルリフレッシュ
  const handleRefresh = useCallback(async () => {
    await loadNotifications();
  }, [loadNotifications]);

  // 空の状態のレンダリング
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="notifications-off" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>通知がありません</Text>
      <Text style={styles.emptyDescription}>新しい通知が届くとここに表示されます</Text>
    </View>
  );

  // リストアイテムのレンダリング
  const renderNotificationItem = ({ item }: { item: PushNotification }) => (
    <NotificationItem notification={item} onPress={handleNotificationPress} />
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>通知</Text>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllAsRead}>
            <Text style={styles.markAllButtonText}>すべて既読</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 未読数表示 */}
      {unreadCount > 0 && (
        <View style={styles.unreadCountContainer}>
          <Text style={styles.unreadCountText}>{unreadCount}件の未読通知があります</Text>
        </View>
      )}

      {/* 通知リスト */}
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            colors={['#4285f4']}
            tintColor="#4285f4"
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={notifications.length === 0 ? styles.emptyList : undefined}
      />

      {/* ローディング表示 */}
      {isLoading && notifications.length === 0 && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4285f4" />
          <Text style={styles.loadingText}>通知を読み込み中...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#4285f4',
  },
  markAllButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  unreadCountContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#e3f2fd',
  },
  unreadCountText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '500',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  unreadItem: {
    backgroundColor: '#fafafa',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  body: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 6,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4285f4',
    marginLeft: 8,
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyList: {
    flex: 1,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});

export default NotificationListScreen;
