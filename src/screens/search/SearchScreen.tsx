import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { ToiletLocation } from '../../types/maps';
import { SortOption } from '../../types/post';
import { useSearch } from '../../hooks/useSearch';
import { toiletTypeOptions } from '../../types/post';

interface ToiletListItemProps {
  toilet: ToiletLocation;
  onPress: (toilet: ToiletLocation) => void;
}

const ToiletListItem: React.FC<ToiletListItemProps> = ({ toilet, onPress }) => {
  const selectedType = toiletTypeOptions.find(option => option.value === toilet.type);

  return (
    <TouchableOpacity style={styles.toiletItem} onPress={() => onPress(toilet)} activeOpacity={0.7}>
      <View style={styles.toiletContent}>
        <View style={styles.toiletHeader}>
          <Text style={styles.toiletTitle}>{toilet.title}</Text>
          <View style={styles.typeContainer}>
            <Text style={styles.typeIcon}>{selectedType?.icon || '🚽'}</Text>
            <Text style={styles.typeLabel}>{selectedType?.label || 'その他'}</Text>
          </View>
        </View>

        {toilet.description && (
          <Text style={styles.toiletDescription} numberOfLines={2}>
            {toilet.description}
          </Text>
        )}

        <View style={styles.toiletMeta}>
          <View style={styles.ratingContainer}>
            <Icon name="star" size={16} color="#FFD700" />
            <Text style={styles.ratingText}>{toilet.rating.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>({toilet.reviewCount})</Text>
          </View>

          {toilet.isAccessible && (
            <View style={styles.accessibleBadge}>
              <Icon name="accessibility" size={14} color="#4CAF50" />
              <Text style={styles.accessibleText}>バリアフリー</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const SearchScreen: React.FC = () => {
  const {
    results,
    isSearching,
    totalCount,
    hasMore,
    searchTime,
    error,
    filters,
    savedSearches,
    searchHistory,
    updateFilters,
    loadMore,
    resetSearch,
    clearFilters,
    quickSearch,
    saveFavoriteSearch,
    applySavedSearch,
    applyHistorySearch,
    hasActiveFilters,
    hasResults,
    isEmpty,
  } = useSearch();

  const [showFilters, setShowFilters] = useState(false);
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // トイレアイテムをタップ
  const handleToiletPress = useCallback((toilet: ToiletLocation) => {
    console.log('Navigate to toilet detail:', toilet.id);
    // TODO: 実際のナビゲーション実装
  }, []);

  // 検索条件を保存
  const handleSaveFavoriteSearch = useCallback(async () => {
    Alert.prompt(
      '検索条件を保存',
      '保存する検索条件の名前を入力してください',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '保存',
          onPress: async name => {
            if (name?.trim()) {
              try {
                await saveFavoriteSearch(name.trim());
                Alert.alert('保存完了', '検索条件を保存しました');
              } catch (error) {
                Alert.alert('エラー', '検索条件の保存に失敗しました');
              }
            }
          },
        },
      ],
      'plain-text',
    );
  }, [saveFavoriteSearch]);

  // フィルターモーダル
  const FilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFilters(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <Icon name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>検索フィルター</Text>
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearText}>クリア</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* ソート */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>並び順</Text>
            <View style={styles.sortOptions}>
              {Object.values(SortOption).map(option => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.sortOption,
                    filters.sortBy === option && styles.selectedSortOption,
                  ]}
                  onPress={() => updateFilters({ sortBy: option })}
                >
                  <Text
                    style={[
                      styles.sortOptionText,
                      filters.sortBy === option && styles.selectedSortOptionText,
                    ]}
                  >
                    {getSortDisplayName(option)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* トイレタイプ */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>トイレタイプ</Text>
            <View style={styles.typeOptions}>
              <TouchableOpacity
                style={[styles.typeOption, !filters.toiletType && styles.selectedTypeOption]}
                onPress={() => updateFilters({ toiletType: undefined })}
              >
                <Text style={styles.typeOptionText}>すべて</Text>
              </TouchableOpacity>
              {toiletTypeOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.typeOption,
                    filters.toiletType === option.value && styles.selectedTypeOption,
                  ]}
                  onPress={() => updateFilters({ toiletType: option.value })}
                >
                  <Text style={styles.typeIcon}>{option.icon}</Text>
                  <Text style={styles.typeOptionText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* その他のフィルター */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>その他</Text>

            <TouchableOpacity
              style={[styles.filterToggle, filters.isAccessible && styles.activeFilterToggle]}
              onPress={() =>
                updateFilters({
                  isAccessible: filters.isAccessible ? undefined : true,
                })
              }
            >
              <Icon name="accessibility" size={20} color="#4CAF50" />
              <Text style={styles.filterToggleText}>バリアフリー対応</Text>
              {filters.isAccessible && <Icon name="checkmark" size={20} color="#4285f4" />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterToggle, filters.hasWashlet && styles.activeFilterToggle]}
              onPress={() =>
                updateFilters({
                  hasWashlet: filters.hasWashlet ? undefined : true,
                })
              }
            >
              <Text style={styles.filterIcon}>🚿</Text>
              <Text style={styles.filterToggleText}>ウォシュレット</Text>
              {filters.hasWashlet && <Icon name="checkmark" size={20} color="#4285f4" />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterToggle, filters.openNow && styles.activeFilterToggle]}
              onPress={() =>
                updateFilters({
                  openNow: filters.openNow ? undefined : true,
                })
              }
            >
              <Icon name="time" size={20} color="#FF9800" />
              <Text style={styles.filterToggleText}>現在営業中</Text>
              {filters.openNow && <Icon name="checkmark" size={20} color="#4285f4" />}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  // 検索結果のレンダリング
  const renderToiletItem = ({ item }: { item: ToiletLocation }) => (
    <ToiletListItem toilet={item} onPress={handleToiletPress} />
  );

  // 空の状態
  const renderEmptyState = () => {
    if (isSearching) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>検索中...</Text>
        </View>
      );
    }

    if (isEmpty) {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="search" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>見つかりませんでした</Text>
          <Text style={styles.emptyDescription}>検索条件を変更してもう一度お試しください</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Icon name="search" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>検索してください</Text>
        <Text style={styles.emptyDescription}>キーワードを入力してトイレを検索できます</Text>

        {/* クイック検索 */}
        <View style={styles.quickSearchContainer}>
          <Text style={styles.quickSearchTitle}>クイック検索</Text>
          <View style={styles.quickSearchButtons}>
            <TouchableOpacity
              style={styles.quickSearchButton}
              onPress={() => quickSearch('nearby')}
            >
              <Icon name="location" size={20} color="#4285f4" />
              <Text style={styles.quickSearchText}>近くのトイレ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickSearchButton}
              onPress={() => quickSearch('accessible')}
            >
              <Icon name="accessibility" size={20} color="#4CAF50" />
              <Text style={styles.quickSearchText}>バリアフリー</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickSearchButton}
              onPress={() => quickSearch('highRated')}
            >
              <Icon name="star" size={20} color="#FFD700" />
              <Text style={styles.quickSearchText}>高評価</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickSearchButton}
              onPress={() => quickSearch('newest')}
            >
              <Icon name="time" size={20} color="#FF9800" />
              <Text style={styles.quickSearchText}>新着</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 検索バー */}
      <View style={styles.searchBar}>
        <View style={styles.searchInputContainer}>
          <Icon name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="トイレを検索..."
            value={filters.query}
            onChangeText={text => updateFilters({ query: text })}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {filters.query.length > 0 && (
            <TouchableOpacity onPress={() => updateFilters({ query: '' })}>
              <Icon name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.filterButton, hasActiveFilters && styles.activeFilterButton]}
          onPress={() => setShowFilters(true)}
        >
          <Icon name="options" size={20} color={hasActiveFilters ? '#fff' : '#666'} />
        </TouchableOpacity>
      </View>

      {/* アクションバー */}
      {(hasResults || filters.query.length > 0) && (
        <View style={styles.actionBar}>
          <View style={styles.resultInfo}>
            {isSearching ? (
              <Text style={styles.resultText}>検索中...</Text>
            ) : (
              <Text style={styles.resultText}>
                {totalCount}件の結果 ({searchTime}ms)
              </Text>
            )}
          </View>

          <View style={styles.actionButtons}>
            {hasActiveFilters && (
              <TouchableOpacity style={styles.actionButton} onPress={handleSaveFavoriteSearch}>
                <Icon name="heart-outline" size={16} color="#4285f4" />
                <Text style={styles.actionButtonText}>保存</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.actionButton} onPress={resetSearch}>
              <Icon name="refresh" size={16} color="#666" />
              <Text style={styles.actionButtonText}>リセット</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 検索結果 */}
      <FlatList
        data={results}
        renderItem={renderToiletItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={renderEmptyState}
        onEndReached={hasMore ? loadMore : undefined}
        onEndReachedThreshold={0.1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={results.length === 0 ? styles.emptyList : undefined}
      />

      {/* エラー表示 */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* フィルターモーダル */}
      <FilterModal />
    </SafeAreaView>
  );
};

// ソート表示名
const getSortDisplayName = (sort: SortOption): string => {
  const names = {
    [SortOption.RELEVANCE]: '関連度',
    [SortOption.DISTANCE]: '距離',
    [SortOption.RATING]: '評価',
    [SortOption.NEWEST]: '新しい順',
    [SortOption.HELPFUL]: '役に立った順',
  };
  return names[sort];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: '#333',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeFilterButton: {
    backgroundColor: '#4285f4',
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
  resultInfo: {
    flex: 1,
  },
  resultText: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#4285f4',
    marginLeft: 4,
  },
  toiletItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  toiletContent: {
    flex: 1,
  },
  toiletHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  toiletTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  typeIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  typeLabel: {
    fontSize: 12,
    color: '#666',
  },
  toiletDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  toiletMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: '#999',
    marginLeft: 2,
  },
  accessibleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  accessibleText: {
    fontSize: 10,
    color: '#4CAF50',
    marginLeft: 2,
    fontWeight: '600',
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
    marginBottom: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  quickSearchContainer: {
    alignItems: 'center',
  },
  quickSearchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  quickSearchButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  quickSearchButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    minWidth: 80,
  },
  quickSearchText: {
    fontSize: 12,
    color: '#333',
    marginTop: 4,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  clearText: {
    fontSize: 16,
    color: '#4285f4',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  sortOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  selectedSortOption: {
    backgroundColor: '#4285f4',
    borderColor: '#4285f4',
  },
  sortOptionText: {
    fontSize: 14,
    color: '#333',
  },
  selectedSortOptionText: {
    color: '#fff',
  },
  typeOptions: {
    gap: 8,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  selectedTypeOption: {
    backgroundColor: '#e3f2fd',
    borderColor: '#4285f4',
  },
  typeOptionText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  activeFilterToggle: {
    backgroundColor: '#e3f2fd',
    borderColor: '#4285f4',
  },
  filterIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  filterToggleText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
});

export default SearchScreen;
