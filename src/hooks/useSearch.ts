import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { ToiletLocation } from '../types/maps';
import { SearchFilters, SearchResult, SortOption, SavedSearch, SearchHistory } from '../types/post';
import { searchService } from '../services/searchService';
import { useAuth } from '../stores/authStore';
import { useLocation } from './useLocation';

// Debounce utility function
const useDebounce = (callback: Function, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    (...args: any[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => callback(...args), delay);
    },
    [callback, delay],
  );
};

interface UseSearchState {
  results: ToiletLocation[];
  isLoading: boolean;
  isSearching: boolean;
  totalCount: number;
  hasMore: boolean;
  searchTime: number;
  error: string | null;
  savedSearches: SavedSearch[];
  searchHistory: SearchHistory[];
}

const initialFilters: SearchFilters = {
  query: '',
  sortBy: SortOption.RELEVANCE,
};

export const useSearch = () => {
  const { user } = useAuth();
  const { getCurrentLocation } = useLocation();

  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [state, setState] = useState<UseSearchState>({
    results: [],
    isLoading: false,
    isSearching: false,
    totalCount: 0,
    hasMore: false,
    searchTime: 0,
    error: null,
    savedSearches: [],
    searchHistory: [],
  });

  const [currentPage, setCurrentPage] = useState(0);
  const PAGE_SIZE = 20;

  // 検索実行（内部用、デバウンスなし）
  const executeSearch = useCallback(
    async (searchFilters: SearchFilters, page: number = 0, append: boolean = false) => {
      setState(prev => ({
        ...prev,
        isSearching: true,
        error: null,
        ...(page === 0 && !append ? { results: [] } : {}),
      }));

      try {
        // 現在位置を取得
        let userLocation;
        try {
          userLocation = await getCurrentLocation();
        } catch (error) {
          console.log('Location not available for search');
        }

        // 検索実行
        const result: SearchResult = await searchService.searchToilets(
          searchFilters,
          userLocation,
          PAGE_SIZE,
          page * PAGE_SIZE,
        );

        setState(prev => ({
          ...prev,
          results: append ? [...prev.results, ...result.toilets] : result.toilets,
          totalCount: result.totalCount,
          hasMore: result.hasMore,
          searchTime: result.searchTime,
          isSearching: false,
        }));

        // 検索履歴を保存（クエリがある場合のみ）
        if (user && searchFilters.query.trim() && !append) {
          await searchService.saveSearchHistory(user.uid, searchFilters, result.totalCount);
          await loadSearchHistory();
        }

        setCurrentPage(page);
      } catch (error) {
        console.error('Search failed:', error);
        setState(prev => ({
          ...prev,
          isSearching: false,
          error: '検索に失敗しました',
        }));
      }
    },
    [user, getCurrentLocation],
  );

  // デバウンス付きの検索関数
  const debouncedSearch = useDebounce(executeSearch, 300);

  // フィルター更新（最適化版）
  const updateFilters = useCallback(
    (updates: Partial<SearchFilters>) => {
      setFilters(prevFilters => {
        const newFilters = { ...prevFilters, ...updates };

        // クエリが変更された場合は自動検索（デバウンス）
        if (updates.query !== undefined) {
          debouncedSearch(newFilters, 0, false);
        }

        return newFilters;
      });
    },
    [debouncedSearch],
  );

  // 次のページを読み込み
  const loadMore = useCallback(async () => {
    if (!state.hasMore || state.isSearching) return;

    await executeSearch(filters, currentPage + 1, true);
  }, [state.hasMore, state.isSearching, filters, currentPage, executeSearch]);

  // 検索をリセット
  const resetSearch = useCallback(() => {
    setFilters(initialFilters);
    setState(prev => ({
      ...prev,
      results: [],
      totalCount: 0,
      hasMore: false,
      searchTime: 0,
      error: null,
    }));
    setCurrentPage(0);
  }, []);

  // 保存された検索条件を読み込み
  const loadSavedSearches = useCallback(async () => {
    if (!user) return;

    try {
      const searches = await searchService.getSavedSearches(user.uid);
      setState(prev => ({ ...prev, savedSearches: searches }));
    } catch (error) {
      console.error('Failed to load saved searches:', error);
    }
  }, [user]);

  // 検索履歴を読み込み
  const loadSearchHistory = useCallback(async () => {
    if (!user) return;

    try {
      const history = await searchService.getSearchHistory(user.uid);
      setState(prev => ({ ...prev, searchHistory: history }));
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  }, [user]);

  // 検索条件を保存
  const saveFavoriteSearch = useCallback(
    async (name: string) => {
      if (!user) return;

      try {
        await searchService.saveFavoriteSearch(user.uid, name, filters);
        await loadSavedSearches();
      } catch (error) {
        console.error('Failed to save favorite search:', error);
        throw error;
      }
    },
    [user, filters, loadSavedSearches],
  );

  // 保存された検索条件を削除
  const deleteSavedSearch = useCallback(
    async (searchId: string) => {
      try {
        await searchService.deleteSavedSearch(searchId);
        await loadSavedSearches();
      } catch (error) {
        console.error('Failed to delete saved search:', error);
        throw error;
      }
    },
    [loadSavedSearches],
  );

  // 保存された検索条件を適用
  const applySavedSearch = useCallback(
    (savedSearch: SavedSearch) => {
      setFilters(savedSearch.filters);
      executeSearch(savedSearch.filters, 0, false);
    },
    [executeSearch],
  );

  // 検索履歴から再検索
  const applyHistorySearch = useCallback(
    (history: SearchHistory) => {
      setFilters(history.filters);
      executeSearch(history.filters, 0, false);
    },
    [executeSearch],
  );

  // クイック検索（よく使われる検索条件）
  const quickSearch = useCallback(
    async (type: 'nearby' | 'accessible' | 'highRated' | 'newest') => {
      let quickFilters: SearchFilters;

      switch (type) {
        case 'nearby':
          quickFilters = { ...initialFilters, sortBy: SortOption.DISTANCE, distance: 1 };
          break;
        case 'accessible':
          quickFilters = { ...initialFilters, isAccessible: true, sortBy: SortOption.DISTANCE };
          break;
        case 'highRated':
          quickFilters = { ...initialFilters, rating: 4, sortBy: SortOption.RATING };
          break;
        case 'newest':
          quickFilters = { ...initialFilters, sortBy: SortOption.NEWEST };
          break;
        default:
          quickFilters = initialFilters;
      }

      setFilters(quickFilters);
      await executeSearch(quickFilters, 0, false);
    },
    [executeSearch],
  );

  // 初期データの読み込み
  useEffect(() => {
    if (user) {
      loadSavedSearches();
      loadSearchHistory();
    }
  }, [user, loadSavedSearches, loadSearchHistory]);

  // フィルターの便利メソッド
  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  // メモ化された計算値
  const hasActiveFilters = useMemo(
    () =>
      filters.toiletType !== undefined ||
      filters.isAccessible !== undefined ||
      filters.hasWashlet !== undefined ||
      filters.rating !== undefined ||
      filters.distance !== undefined ||
      filters.openNow !== undefined ||
      filters.sortBy !== SortOption.RELEVANCE,
    [filters],
  );

  const hasResults = useMemo(() => state.results.length > 0, [state.results.length]);

  const isEmpty = useMemo(
    () => !state.isSearching && state.results.length === 0 && filters.query.trim() !== '',
    [state.isSearching, state.results.length, filters.query],
  );

  return {
    // 状態
    results: state.results,
    isLoading: state.isLoading,
    isSearching: state.isSearching,
    totalCount: state.totalCount,
    hasMore: state.hasMore,
    searchTime: state.searchTime,
    error: state.error,
    filters,
    savedSearches: state.savedSearches,
    searchHistory: state.searchHistory,

    // アクション
    search: () => executeSearch(filters, 0, false),
    updateFilters,
    loadMore,
    resetSearch,
    clearFilters,
    quickSearch,
    saveFavoriteSearch,
    deleteSavedSearch,
    applySavedSearch,
    applyHistorySearch,
    refresh: () => Promise.all([loadSavedSearches(), loadSearchHistory()]),

    // 計算値（メモ化済み）
    hasActiveFilters,
    hasResults,
    isEmpty,
  };
};
