import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Badge, BadgeCategory, BadgeRarity } from '../../types/post';
import { useBadges } from '../../hooks/useBadges';
import BadgeItem from '../../components/badge/BadgeItem';
import { CATEGORY_COLORS, RARITY_COLORS } from '../../data/badges';

const BadgeScreen: React.FC = () => {
  const {
    allBadges,
    isLoading,
    badgeCount,
    totalBadges,
    completionRate,
    getBadgeCountByCategory,
    getBadgeCountByRarity,
    hasBadge,
  } = useBadges();

  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | 'all'>('all');
  const [selectedRarity, setSelectedRarity] = useState<BadgeRarity | 'all'>('all');
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [showBadgeDetail, setShowBadgeDetail] = useState(false);

  // フィルタリングされたバッジ
  const filteredBadges = allBadges.filter(badge => {
    if (selectedCategory !== 'all' && badge.category !== selectedCategory) {
      return false;
    }
    if (selectedRarity !== 'all' && badge.rarity !== selectedRarity) {
      return false;
    }
    return true;
  });

  // バッジ詳細モーダルを開く
  const handleBadgePress = useCallback((badge: Badge) => {
    setSelectedBadge(badge);
    setShowBadgeDetail(true);
  }, []);

  // バッジ詳細モーダルを閉じる
  const closeBadgeDetail = useCallback(() => {
    setShowBadgeDetail(false);
    setSelectedBadge(null);
  }, []);

  // カテゴリフィルター
  const CategoryFilter: React.FC = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
      <TouchableOpacity
        style={[styles.filterButton, selectedCategory === 'all' && styles.activeFilter]}
        onPress={() => setSelectedCategory('all')}
      >
        <Text style={[styles.filterText, selectedCategory === 'all' && styles.activeFilterText]}>
          すべて
        </Text>
      </TouchableOpacity>

      {Object.values(BadgeCategory).map(category => {
        const count = getBadgeCountByCategory(category);
        return (
          <TouchableOpacity
            key={category}
            style={[
              styles.filterButton,
              { borderColor: CATEGORY_COLORS[category] },
              selectedCategory === category && [
                styles.activeFilter,
                { backgroundColor: CATEGORY_COLORS[category] },
              ],
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[styles.filterText, selectedCategory === category && styles.activeFilterText]}
            >
              {getCategoryDisplayName(category)} ({count.unlocked}/{count.total})
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  // レア度フィルター
  const RarityFilter: React.FC = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
      <TouchableOpacity
        style={[styles.filterButton, selectedRarity === 'all' && styles.activeFilter]}
        onPress={() => setSelectedRarity('all')}
      >
        <Text style={[styles.filterText, selectedRarity === 'all' && styles.activeFilterText]}>
          すべて
        </Text>
      </TouchableOpacity>

      {Object.values(BadgeRarity).map(rarity => {
        const count = getBadgeCountByRarity(rarity);
        return (
          <TouchableOpacity
            key={rarity}
            style={[
              styles.filterButton,
              { borderColor: RARITY_COLORS[rarity] },
              selectedRarity === rarity && [
                styles.activeFilter,
                { backgroundColor: RARITY_COLORS[rarity] },
              ],
            ]}
            onPress={() => setSelectedRarity(rarity)}
          >
            <Text style={[styles.filterText, selectedRarity === rarity && styles.activeFilterText]}>
              {getRarityDisplayName(rarity)} ({count.unlocked}/{count.total})
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4285f4" />
          <Text style={styles.loadingText}>バッジ情報を読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>バッジコレクション</Text>
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {badgeCount}/{totalBadges} ({completionRate.toFixed(1)}%)
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${completionRate}%` }]} />
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* カテゴリフィルター */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>カテゴリ</Text>
          <CategoryFilter />
        </View>

        {/* レア度フィルター */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>レア度</Text>
          <RarityFilter />
        </View>

        {/* バッジグリッド */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>バッジ ({filteredBadges.length}個)</Text>
          <View style={styles.badgeGrid}>
            {filteredBadges.map(badge => (
              <BadgeItem
                key={badge.id}
                badge={badge}
                unlocked={hasBadge(badge.id)}
                size="medium"
                onPress={() => handleBadgePress(badge)}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* バッジ詳細モーダル */}
      <Modal
        visible={showBadgeDetail}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeBadgeDetail}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeBadgeDetail}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>バッジ詳細</Text>
            <View style={styles.placeholder} />
          </View>

          {selectedBadge && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.badgeDetailContainer}>
                <BadgeItem
                  badge={selectedBadge}
                  unlocked={hasBadge(selectedBadge.id)}
                  size="large"
                  showDetails={true}
                />

                {!hasBadge(selectedBadge.id) && (
                  <View style={styles.conditionContainer}>
                    <Text style={styles.conditionTitle}>取得条件</Text>
                    <Text style={styles.conditionText}>{getConditionText(selectedBadge)}</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

// カテゴリ表示名
const getCategoryDisplayName = (category: BadgeCategory): string => {
  const categoryNames = {
    [BadgeCategory.POSTING]: '投稿',
    [BadgeCategory.REVIEWING]: 'レビュー',
    [BadgeCategory.EXPLORATION]: '探索',
    [BadgeCategory.COMMUNITY]: 'コミュニティ',
    [BadgeCategory.SPECIAL]: '特別',
  };
  return categoryNames[category];
};

// レア度表示名
const getRarityDisplayName = (rarity: BadgeRarity): string => {
  const rarityNames = {
    [BadgeRarity.COMMON]: 'コモン',
    [BadgeRarity.UNCOMMON]: 'アンコモン',
    [BadgeRarity.RARE]: 'レア',
    [BadgeRarity.EPIC]: 'エピック',
    [BadgeRarity.LEGENDARY]: 'レジェンダリー',
  };
  return rarityNames[rarity];
};

// 取得条件のテキスト
const getConditionText = (badge: Badge): string => {
  const { condition } = badge;

  switch (condition.type) {
    case 'count':
      return `${getTargetDisplayName(condition.target)}を${condition.value}回達成`;
    case 'rating':
      return `${getTargetDisplayName(condition.target)}が${condition.value}以上`;
    case 'streak':
      return `${condition.value}日間連続で${getTargetDisplayName(condition.target)}`;
    case 'special':
      return badge.description;
    default:
      return badge.description;
  }
};

// ターゲット表示名
const getTargetDisplayName = (target: string): string => {
  const targetNames: Record<string, string> = {
    toilets_posted: 'トイレ投稿',
    helpful_votes_given: '「役に立った」投票',
    helpful_votes_received: '「役に立った」を受ける',
    unique_areas_posted: '異なる地域での投稿',
    toilet_types_posted: '異なるタイプのトイレ投稿',
    accessible_toilets_posted: 'バリアフリートイレ投稿',
    daily_posts: '毎日投稿',
    helpful_ratio: '役に立った比率',
    avg_cleanliness_rating: '平均清潔度評価',
  };
  return targetNames[target] || target;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  statsContainer: {
    alignItems: 'flex-end',
  },
  statsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  progressBar: {
    width: 200,
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4285f4',
    borderRadius: 3,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    marginRight: 8,
  },
  activeFilter: {
    backgroundColor: '#4285f4',
    borderColor: '#4285f4',
  },
  filterText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#fff',
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 24,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  badgeDetailContainer: {
    alignItems: 'center',
  },
  conditionContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    width: '100%',
  },
  conditionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  conditionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default BadgeScreen;
