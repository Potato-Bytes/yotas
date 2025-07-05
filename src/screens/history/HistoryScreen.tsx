import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { ViewHistory, Favorite, UserActivity, ActivityType } from '../../types/post';
import { useHistory } from '../../hooks/useHistory';
import { toiletTypeOptions } from '../../types/post';

type TabType = 'history' | 'favorites' | 'activities';

interface HistoryItemProps {
  item: ViewHistory;
  onPress: (toiletId: string) => void;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ item, onPress }) => {
  const typeOption = toiletTypeOptions.find(option => option.value === item.toiletType);
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return '今日';
    } else if (diffDays === 1) {
      return '昨日';
    } else if (diffDays < 7) {
      return `${diffDays}日前`;
    } else {
      return date.toLocaleDateString('ja-JP');
    }
  };

  return (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => onPress(item.toiletId)}
      activeOpacity={0.7}
    >
      <View style={styles.historyContent}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>{item.toiletTitle}</Text>
          <View style={styles.typeContainer}>
            <Text style={styles.typeIcon}>{typeOption?.icon || '🚽'}</Text>
            <Text style={styles.typeLabel}>{typeOption?.label || 'その他'}</Text>
          </View>
        </View>

        <View style={styles.historyMeta}>
          <Text style={styles.viewedDate}>{formatDate(item.viewedAt)}</Text>
          <Text style={styles.viewCount}>閲覧回数: {item.viewCount}回</Text>
        </View>
      </View>

      <Icon name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );
};

interface FavoriteItemProps {
  item: Favorite;
  onPress: (toiletId: string) => void;
  onRemove: (toiletId: string) => void;
}

const FavoriteItem: React.FC<FavoriteItemProps> = ({ item, onPress, onRemove }) => {
  const typeOption = toiletTypeOptions.find(option => option.value === item.toiletType);

  const handleRemove = () => {
    Alert.alert('お気に入りから削除', `「${item.toiletTitle}」をお気に入りから削除しますか？`, [
      { text: 'キャンセル', style: 'cancel' },
      { text: '削除', style: 'destructive', onPress: () => onRemove(item.toiletId) },
    ]);
  };

  return (
    <TouchableOpacity
      style={styles.favoriteItem}
      onPress={() => onPress(item.toiletId)}
      activeOpacity={0.7}
    >
      <View style={styles.favoriteContent}>
        <View style={styles.favoriteHeader}>
          <Text style={styles.favoriteTitle}>{item.toiletTitle}</Text>
          <TouchableOpacity onPress={handleRemove} style={styles.removeButton}>
            <Icon name="heart" size={20} color="#ff4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.favoriteInfo}>
          <View style={styles.typeContainer}>
            <Text style={styles.typeIcon}>{typeOption?.icon || '🚽'}</Text>
            <Text style={styles.typeLabel}>{typeOption?.label || 'その他'}</Text>
          </View>
          <Text style={styles.addedDate}>{item.addedAt.toLocaleDateString('ja-JP')}に追加</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

interface ActivityItemProps {
  item: UserActivity;
  onPress: (targetId: string) => void;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ item, onPress }) => {
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case ActivityType.TOILET_POSTED:
        return '📝';
      case ActivityType.TOILET_UPDATED:
        return '✏️';
      case ActivityType.HELPFUL_VOTE:
        return '👍';
      case ActivityType.BADGE_EARNED:
        return '🏆';
      case ActivityType.FAVORITE_ADDED:
        return '❤️';
      case ActivityType.REVIEW_POSTED:
        return '⭐';
      default:
        return '📋';
    }
  };

  const formatDateTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) {
      return 'たった今';
    } else if (diffHours < 24) {
      return `${diffHours}時間前`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}日前`;
    }
  };

  return (
    <TouchableOpacity
      style={styles.activityItem}
      onPress={() => onPress(item.targetId)}
      activeOpacity={0.7}
    >
      <View style={styles.activityIcon}>
        <Text style={styles.activityEmoji}>{getActivityIcon(item.type)}</Text>
      </View>

      <View style={styles.activityContent}>
        <Text style={styles.activityDescription}>{item.description}</Text>
        <Text style={styles.activityTime}>{formatDateTime(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const HistoryScreen: React.FC = () => {
  const {
    viewHistory,
    favorites,
    activities,
    userStats,
    isLoading,
    isUpdating,
    clearViewHistory,
    removeFromFavorites,
    refresh,
  } = useHistory();

  const [activeTab, setActiveTab] = useState<TabType>('history');

  const handleToiletPress = useCallback((toiletId: string) => {
    console.log('Navigate to toilet:', toiletId);
    // TODO: 実際のナビゲーション実装
  }, []);

  const handleRemoveFavorite = useCallback(
    async (toiletId: string) => {
      await removeFromFavorites(toiletId);
    },
    [removeFromFavorites],
  );

  const handleActivityPress = useCallback((targetId: string) => {
    console.log('Navigate to activity target:', targetId);
    // TODO: 実際のナビゲーション実装
  }, []);

  const renderHistoryItem = ({ item }: { item: ViewHistory }) => (
    <HistoryItem item={item} onPress={handleToiletPress} />
  );

  const renderFavoriteItem = ({ item }: { item: Favorite }) => (
    <FavoriteItem item={item} onPress={handleToiletPress} onRemove={handleRemoveFavorite} />
  );

  const renderActivityItem = ({ item }: { item: UserActivity }) => (
    <ActivityItem item={item} onPress={handleActivityPress} />
  );

  const renderEmptyState = (type: TabType) => {
    const messages = {
      history: {
        title: '履歴がありません',
        description: 'トイレの詳細画面を見ると、ここに履歴が表示されます',
        icon: 'time-outline',
      },
      favorites: {
        title: 'お気に入りがありません',
        description: 'お気に入りに追加したトイレがここに表示されます',
        icon: 'heart-outline',
      },
      activities: {
        title: '活動履歴がありません',
        description: '投稿や評価などの活動がここに表示されます',
        icon: 'list-outline',
      },
    };

    const message = messages[type];

    return (
      <View style={styles.emptyContainer}>
        <Icon name={message.icon} size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>{message.title}</Text>
        <Text style={styles.emptyDescription}>{message.description}</Text>
      </View>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'history':
        return (
          <FlatList
            data={viewHistory}
            renderItem={renderHistoryItem}
            keyExtractor={item => item.id}
            ListEmptyComponent={() => renderEmptyState('history')}
            refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={viewHistory.length === 0 ? styles.emptyList : undefined}
          />
        );

      case 'favorites':
        return (
          <FlatList
            data={favorites}
            renderItem={renderFavoriteItem}
            keyExtractor={item => item.id}
            ListEmptyComponent={() => renderEmptyState('favorites')}
            refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={favorites.length === 0 ? styles.emptyList : undefined}
          />
        );

      case 'activities':
        return (
          <FlatList
            data={activities}
            renderItem={renderActivityItem}
            keyExtractor={item => item.id}
            ListEmptyComponent={() => renderEmptyState('activities')}
            refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={activities.length === 0 ? styles.emptyList : undefined}
          />
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 統計情報 */}
      {userStats && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userStats.totalPosts}</Text>
            <Text style={styles.statLabel}>投稿</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userStats.totalViews}</Text>
            <Text style={styles.statLabel}>閲覧</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userStats.totalFavorites}</Text>
            <Text style={styles.statLabel}>お気に入り</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userStats.totalBadges}</Text>
            <Text style={styles.statLabel}>バッジ</Text>
          </View>
        </ScrollView>
      )}

      {/* タブバー */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Icon name="time" size={20} color={activeTab === 'history' ? '#4285f4' : '#999'} />
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            履歴
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'favorites' && styles.activeTab]}
          onPress={() => setActiveTab('favorites')}
        >
          <Icon name="heart" size={20} color={activeTab === 'favorites' ? '#4285f4' : '#999'} />
          <Text style={[styles.tabText, activeTab === 'favorites' && styles.activeTabText]}>
            お気に入り
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'activities' && styles.activeTab]}
          onPress={() => setActiveTab('activities')}
        >
          <Icon name="list" size={20} color={activeTab === 'activities' ? '#4285f4' : '#999'} />
          <Text style={[styles.tabText, activeTab === 'activities' && styles.activeTabText]}>
            活動
          </Text>
        </TouchableOpacity>
      </View>

      {/* アクションバー */}
      {activeTab === 'history' && viewHistory.length > 0 && (
        <View style={styles.actionBar}>
          <Text style={styles.actionBarText}>{viewHistory.length}件の履歴</Text>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearViewHistory}
            disabled={isUpdating}
          >
            <Icon name="trash-outline" size={16} color="#ff4444" />
            <Text style={styles.clearButtonText}>クリア</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* タブコンテンツ */}
      <View style={styles.content}>{renderTabContent()}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statItem: {
    alignItems: 'center',
    marginRight: 24,
    minWidth: 60,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4285f4',
  },
  tabText: {
    fontSize: 14,
    color: '#999',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#4285f4',
    fontWeight: '600',
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  actionBarText: {
    fontSize: 14,
    color: '#666',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  clearButtonText: {
    fontSize: 12,
    color: '#ff4444',
    marginLeft: 4,
  },
  content: {
    flex: 1,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  historyContent: {
    flex: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  historyTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  historyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewedDate: {
    fontSize: 12,
    color: '#666',
  },
  viewCount: {
    fontSize: 12,
    color: '#999',
  },
  favoriteItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  favoriteContent: {
    flex: 1,
  },
  favoriteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  favoriteTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  removeButton: {
    padding: 4,
  },
  favoriteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addedDate: {
    fontSize: 12,
    color: '#666',
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  typeLabel: {
    fontSize: 12,
    color: '#666',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityEmoji: {
    fontSize: 20,
  },
  activityContent: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
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
});

export default HistoryScreen;
