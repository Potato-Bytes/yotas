import firestore from '@react-native-firebase/firestore';
import { ToiletLocation } from '../types/maps';
import { SearchFilters, SearchResult, SortOption, SavedSearch, SearchHistory } from '../types/post';

export class SearchService {
  private toiletsCollection = firestore().collection('toilets');
  private savedSearchesCollection = firestore().collection('saved_searches');
  private searchHistoryCollection = firestore().collection('search_history');

  /**
   * トイレを検索
   */
  async searchToilets(
    filters: SearchFilters,
    userLocation?: { latitude: number; longitude: number },
    limit: number = 20,
    offset: number = 0,
  ): Promise<SearchResult> {
    const startTime = Date.now();

    try {
      let query = this.toiletsCollection.where('isActive', '==', true);

      // テキスト検索（タイトルと説明）
      if (filters.query.trim()) {
        // Firestoreの制限により、クライアントサイドでフィルタリング
        // 実際の実装では Algolia や ElasticSearch を推奨
        const allToilets = await this.getAllActiveToilets();
        const filteredToilets = this.filterByText(allToilets, filters.query);
        const finalResults = this.applyFilters(filteredToilets, filters, userLocation);
        const sortedResults = this.sortResults(finalResults, filters.sortBy, userLocation);

        const paginatedResults = sortedResults.slice(offset, offset + limit);

        return {
          toilets: paginatedResults,
          totalCount: sortedResults.length,
          hasMore: offset + limit < sortedResults.length,
          searchTime: Date.now() - startTime,
        };
      }

      // フィルター条件の適用
      if (filters.toiletType) {
        query = query.where('type', '==', filters.toiletType);
      }

      if (filters.isAccessible !== undefined) {
        query = query.where('isAccessible', '==', filters.isAccessible);
      }

      if (filters.rating !== undefined) {
        query = query.where('rating', '>=', filters.rating);
      }

      // データ取得
      let snapshot;
      switch (filters.sortBy) {
        case SortOption.RATING:
          snapshot = await query
            .orderBy('rating', 'desc')
            .limit(limit + offset)
            .get();
          break;
        case SortOption.NEWEST:
          snapshot = await query
            .orderBy('createdAt', 'desc')
            .limit(limit + offset)
            .get();
          break;
        case SortOption.HELPFUL:
          snapshot = await query
            .orderBy('reviewCount', 'desc')
            .limit(limit + offset)
            .get();
          break;
        default:
          snapshot = await query.limit(limit + offset).get();
      }

      const allResults: ToiletLocation[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        allResults.push({
          id: data.id,
          title: data.title,
          description: data.description,
          latitude: data.location.latitude,
          longitude: data.location.longitude,
          type: data.type,
          isAccessible: data.isAccessible,
          rating: data.rating,
          reviewCount: data.reviewCount,
          createdBy: data.createdBy,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        });
      });

      // 追加フィルタリング
      const filteredResults = this.applyAdditionalFilters(allResults, filters, userLocation);

      // 距離ソートの場合はクライアントサイドで処理
      const sortedResults =
        filters.sortBy === SortOption.DISTANCE && userLocation
          ? this.sortByDistance(filteredResults, userLocation)
          : filteredResults;

      const paginatedResults = sortedResults.slice(offset, offset + limit);

      return {
        toilets: paginatedResults,
        totalCount: sortedResults.length,
        hasMore: offset + limit < sortedResults.length,
        searchTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('Failed to search toilets:', error);
      return {
        toilets: [],
        totalCount: 0,
        hasMore: false,
        searchTime: Date.now() - startTime,
      };
    }
  }

  /**
   * 全てのアクティブなトイレを取得（テキスト検索用）
   */
  private async getAllActiveToilets(): Promise<ToiletLocation[]> {
    const snapshot = await this.toiletsCollection.where('isActive', '==', true).get();

    const toilets: ToiletLocation[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      toilets.push({
        id: data.id,
        title: data.title,
        description: data.description,
        latitude: data.location.latitude,
        longitude: data.location.longitude,
        type: data.type,
        isAccessible: data.isAccessible,
        rating: data.rating,
        reviewCount: data.reviewCount,
        createdBy: data.createdBy,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      });
    });

    return toilets;
  }

  /**
   * テキストによるフィルタリング
   */
  private filterByText(toilets: ToiletLocation[], query: string): ToiletLocation[] {
    const lowerQuery = query.toLowerCase();
    return toilets.filter(
      toilet =>
        toilet.title.toLowerCase().includes(lowerQuery) ||
        toilet.description.toLowerCase().includes(lowerQuery),
    );
  }

  /**
   * フィルター条件の適用
   */
  private applyFilters(
    toilets: ToiletLocation[],
    filters: SearchFilters,
    userLocation?: { latitude: number; longitude: number },
  ): ToiletLocation[] {
    return toilets.filter(toilet => {
      // トイレタイプ
      if (filters.toiletType && toilet.type !== filters.toiletType) {
        return false;
      }

      // バリアフリー
      if (filters.isAccessible !== undefined && toilet.isAccessible !== filters.isAccessible) {
        return false;
      }

      // 評価
      if (filters.rating !== undefined && toilet.rating < filters.rating) {
        return false;
      }

      // 距離
      if (filters.distance && userLocation) {
        const distance = this.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          toilet.latitude,
          toilet.longitude,
        );
        if (distance > filters.distance) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * 追加フィルターの適用
   */
  private applyAdditionalFilters(
    toilets: ToiletLocation[],
    filters: SearchFilters,
    userLocation?: { latitude: number; longitude: number },
  ): ToiletLocation[] {
    return toilets.filter(toilet => {
      // 距離フィルター
      if (filters.distance && userLocation) {
        const distance = this.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          toilet.latitude,
          toilet.longitude,
        );
        if (distance > filters.distance) {
          return false;
        }
      }

      // 営業時間フィルター（簡略化）
      if (filters.openNow) {
        // 実際の実装では営業時間データを使用
        return true; // 常に営業中とみなす
      }

      return true;
    });
  }

  /**
   * 結果のソート
   */
  private sortResults(
    toilets: ToiletLocation[],
    sortBy: SortOption,
    userLocation?: { latitude: number; longitude: number },
  ): ToiletLocation[] {
    switch (sortBy) {
      case SortOption.DISTANCE:
        return userLocation ? this.sortByDistance(toilets, userLocation) : toilets;

      case SortOption.RATING:
        return toilets.sort((a, b) => b.rating - a.rating);

      case SortOption.NEWEST:
        return toilets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      case SortOption.HELPFUL:
        return toilets.sort((a, b) => b.reviewCount - a.reviewCount);

      case SortOption.RELEVANCE:
      default:
        return toilets; // 関連度ソートは検索エンジンに依存
    }
  }

  /**
   * 距離でソート
   */
  private sortByDistance(
    toilets: ToiletLocation[],
    userLocation: { latitude: number; longitude: number },
  ): ToiletLocation[] {
    return toilets.sort((a, b) => {
      const distanceA = this.calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        a.latitude,
        a.longitude,
      );
      const distanceB = this.calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        b.latitude,
        b.longitude,
      );
      return distanceA - distanceB;
    });
  }

  /**
   * 距離計算（ハーバイン公式）
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // 地球の半径 (km)
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * 検索履歴を保存
   */
  async saveSearchHistory(
    userId: string,
    filters: SearchFilters,
    resultCount: number,
  ): Promise<void> {
    try {
      const historyData = {
        id: this.searchHistoryCollection.doc().id,
        userId,
        query: filters.query,
        filters,
        resultCount,
        searchedAt: firestore.Timestamp.now(),
      };

      await this.searchHistoryCollection.add(historyData);

      // 古い履歴を削除（最新50件のみ保持）
      const oldHistory = await this.searchHistoryCollection
        .where('userId', '==', userId)
        .orderBy('searchedAt', 'desc')
        .offset(50)
        .get();

      const batch = firestore().batch();
      oldHistory.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  }

  /**
   * 検索履歴を取得
   */
  async getSearchHistory(userId: string, limit: number = 10): Promise<SearchHistory[]> {
    try {
      const snapshot = await this.searchHistoryCollection
        .where('userId', '==', userId)
        .orderBy('searchedAt', 'desc')
        .limit(limit)
        .get();

      const history: SearchHistory[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        history.push({
          id: data.id,
          userId: data.userId,
          query: data.query,
          filters: data.filters,
          resultCount: data.resultCount,
          searchedAt: data.searchedAt.toDate(),
        });
      });

      return history;
    } catch (error) {
      console.error('Failed to get search history:', error);
      return [];
    }
  }

  /**
   * 保存された検索条件を作成
   */
  async saveFavoriteSearch(userId: string, name: string, filters: SearchFilters): Promise<void> {
    try {
      const savedSearchData = {
        id: this.savedSearchesCollection.doc().id,
        userId,
        name,
        filters,
        createdAt: firestore.Timestamp.now(),
        lastUsed: firestore.Timestamp.now(),
      };

      await this.savedSearchesCollection.add(savedSearchData);
    } catch (error) {
      console.error('Failed to save favorite search:', error);
      throw new Error('検索条件の保存に失敗しました');
    }
  }

  /**
   * 保存された検索条件を取得
   */
  async getSavedSearches(userId: string): Promise<SavedSearch[]> {
    try {
      const snapshot = await this.savedSearchesCollection
        .where('userId', '==', userId)
        .orderBy('lastUsed', 'desc')
        .get();

      const searches: SavedSearch[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        searches.push({
          id: data.id,
          userId: data.userId,
          name: data.name,
          filters: data.filters,
          createdAt: data.createdAt.toDate(),
          lastUsed: data.lastUsed.toDate(),
        });
      });

      return searches;
    } catch (error) {
      console.error('Failed to get saved searches:', error);
      return [];
    }
  }

  /**
   * 保存された検索条件を削除
   */
  async deleteSavedSearch(searchId: string): Promise<void> {
    try {
      await this.savedSearchesCollection.doc(searchId).delete();
    } catch (error) {
      console.error('Failed to delete saved search:', error);
      throw new Error('検索条件の削除に失敗しました');
    }
  }
}

// シングルトンインスタンス
export const searchService = new SearchService();
