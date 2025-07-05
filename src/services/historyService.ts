import firestore from '@react-native-firebase/firestore';
import { ViewHistory, Favorite, UserActivity, ActivityType, UserStats } from '../types/post';
import { ToiletLocation } from '../types/maps';

export class HistoryService {
  private get viewHistoryCollection() {
    return firestore().collection('view_history');
  }
  
  private get favoritesCollection() {
    return firestore().collection('favorites');
  }
  
  private get activitiesCollection() {
    return firestore().collection('user_activities');
  }
  
  private get userStatsCollection() {
    return firestore().collection('user_stats');
  }

  /**
   * 閲覧履歴を記録
   */
  async recordView(userId: string, toilet: ToiletLocation): Promise<void> {
    try {
      // 既存の履歴をチェック
      const existingHistory = await this.viewHistoryCollection
        .where('userId', '==', userId)
        .where('toiletId', '==', toilet.id)
        .get();

      if (!existingHistory.empty) {
        // 既存の履歴を更新
        const historyDoc = existingHistory.docs[0];
        const data = historyDoc.data();

        await historyDoc.ref.update({
          viewedAt: firestore.Timestamp.now(),
          viewCount: (data.viewCount || 1) + 1,
        });
      } else {
        // 新しい履歴を作成
        const historyData: ViewHistory = {
          id: this.viewHistoryCollection.doc().id,
          userId,
          toiletId: toilet.id,
          toiletTitle: toilet.title,
          toiletType: toilet.type,
          viewedAt: new Date(),
          viewCount: 1,
        };

        await this.viewHistoryCollection.add({
          ...historyData,
          viewedAt: firestore.Timestamp.now(),
        });
      }

      // ユーザー統計を更新
      await this.updateUserStats(userId, { totalViews: 1 });

      // 古い履歴を削除（最新100件のみ保持）
      const allHistory = await this.viewHistoryCollection
        .where('userId', '==', userId)
        .orderBy('viewedAt', 'desc')
        .get();

      if (allHistory.docs.length > 100) {
        const batch = firestore().batch();
        // 100件より古いものを削除
        allHistory.docs.slice(100).forEach((doc: any) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      }
    } catch (error) {
      console.error('Failed to record view:', error);
    }
  }

  /**
   * 閲覧履歴を取得
   */
  async getViewHistory(userId: string, limit: number = 20): Promise<ViewHistory[]> {
    try {
      const snapshot = await this.viewHistoryCollection
        .where('userId', '==', userId)
        .orderBy('viewedAt', 'desc')
        .limit(limit)
        .get();

      const history: ViewHistory[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        history.push({
          id: doc.id,
          userId: data.userId,
          toiletId: data.toiletId,
          toiletTitle: data.toiletTitle,
          toiletType: data.toiletType,
          viewedAt: data.viewedAt.toDate(),
          viewCount: data.viewCount || 1,
        });
      });

      return history;
    } catch (error) {
      console.error('Failed to get view history:', error);
      return [];
    }
  }

  /**
   * 閲覧履歴をクリア
   */
  async clearViewHistory(userId: string): Promise<void> {
    try {
      const snapshot = await this.viewHistoryCollection.where('userId', '==', userId).get();

      const batch = firestore().batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error('Failed to clear view history:', error);
      throw new Error('履歴の削除に失敗しました');
    }
  }

  /**
   * お気に入りに追加
   */
  async addToFavorites(userId: string, toilet: ToiletLocation): Promise<void> {
    try {
      // 既にお気に入りに追加されているかチェック
      const existing = await this.favoritesCollection
        .where('userId', '==', userId)
        .where('toiletId', '==', toilet.id)
        .get();

      if (!existing.empty) {
        throw new Error('既にお気に入りに追加されています');
      }

      const favoriteData: Favorite = {
        id: this.favoritesCollection.doc().id,
        userId,
        toiletId: toilet.id,
        toiletTitle: toilet.title,
        toiletType: toilet.type,
        addedAt: new Date(),
      };

      await this.favoritesCollection.add({
        ...favoriteData,
        addedAt: firestore.Timestamp.now(),
      });

      // アクティビティを記録
      await this.recordActivity(
        userId,
        ActivityType.FAVORITE_ADDED,
        toilet.id,
        toilet.title,
        `「${toilet.title}」をお気に入りに追加しました`,
      );

      // ユーザー統計を更新
      await this.updateUserStats(userId, { totalFavorites: 1 });
    } catch (error) {
      console.error('Failed to add to favorites:', error);
      throw error;
    }
  }

  /**
   * お気に入りから削除
   */
  async removeFromFavorites(userId: string, toiletId: string): Promise<void> {
    try {
      const snapshot = await this.favoritesCollection
        .where('userId', '==', userId)
        .where('toiletId', '==', toiletId)
        .get();

      if (snapshot.empty) {
        throw new Error('お気に入りに登録されていません');
      }

      const batch = firestore().batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      // ユーザー統計を更新
      await this.updateUserStats(userId, { totalFavorites: -1 });
    } catch (error) {
      console.error('Failed to remove from favorites:', error);
      throw error;
    }
  }

  /**
   * お気に入り一覧を取得
   */
  async getFavorites(userId: string): Promise<Favorite[]> {
    try {
      const snapshot = await this.favoritesCollection
        .where('userId', '==', userId)
        .orderBy('addedAt', 'desc')
        .get();

      const favorites: Favorite[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        favorites.push({
          id: doc.id,
          userId: data.userId,
          toiletId: data.toiletId,
          toiletTitle: data.toiletTitle,
          toiletType: data.toiletType,
          addedAt: data.addedAt.toDate(),
          lastViewed: data.lastViewed?.toDate(),
        });
      });

      return favorites;
    } catch (error) {
      console.error('Failed to get favorites:', error);
      return [];
    }
  }

  /**
   * お気に入りかどうかチェック
   */
  async isFavorite(userId: string, toiletId: string): Promise<boolean> {
    try {
      const snapshot = await this.favoritesCollection
        .where('userId', '==', userId)
        .where('toiletId', '==', toiletId)
        .get();

      return !snapshot.empty;
    } catch (error) {
      console.error('Failed to check favorite status:', error);
      return false;
    }
  }

  /**
   * ユーザーアクティビティを記録
   */
  async recordActivity(
    userId: string,
    type: ActivityType,
    targetId: string,
    targetTitle: string,
    description: string,
  ): Promise<void> {
    try {
      const activityData: UserActivity = {
        id: this.activitiesCollection.doc().id,
        userId,
        type,
        targetId,
        targetTitle,
        description,
        createdAt: new Date(),
      };

      await this.activitiesCollection.add({
        ...activityData,
        createdAt: firestore.Timestamp.now(),
      });

      // 古いアクティビティを削除（最新200件のみ保持）
      const allActivities = await this.activitiesCollection
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      if (allActivities.docs.length > 200) {
        const batch = firestore().batch();
        // 200件より古いものを削除
        allActivities.docs.slice(200).forEach((doc: any) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      }
    } catch (error) {
      console.error('Failed to record activity:', error);
    }
  }

  /**
   * ユーザーアクティビティを取得
   */
  async getUserActivities(userId: string, limit: number = 50): Promise<UserActivity[]> {
    try {
      const snapshot = await this.activitiesCollection
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      const activities: UserActivity[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        activities.push({
          id: doc.id,
          userId: data.userId,
          type: data.type,
          targetId: data.targetId,
          targetTitle: data.targetTitle,
          description: data.description,
          createdAt: data.createdAt.toDate(),
        });
      });

      return activities;
    } catch (error) {
      console.error('Failed to get user activities:', error);
      return [];
    }
  }

  /**
   * ユーザー統計を取得
   */
  async getUserStats(userId: string): Promise<UserStats> {
    try {
      const doc = await this.userStatsCollection.doc(userId).get();

      if (!doc.exists) {
        // 初期統計データを作成
        const initialStats: UserStats = {
          userId,
          totalPosts: 0,
          totalViews: 0,
          totalFavorites: 0,
          totalHelpfulVotes: 0,
          totalBadges: 0,
          joinedAt: new Date(),
          lastActiveAt: new Date(),
          streak: 0,
        };

        await this.userStatsCollection.doc(userId).set({
          ...initialStats,
          joinedAt: firestore.Timestamp.now(),
          lastActiveAt: firestore.Timestamp.now(),
        });

        return initialStats;
      }

      const data = doc.data()!;
      return {
        userId: data.userId,
        totalPosts: data.totalPosts || 0,
        totalViews: data.totalViews || 0,
        totalFavorites: data.totalFavorites || 0,
        totalHelpfulVotes: data.totalHelpfulVotes || 0,
        totalBadges: data.totalBadges || 0,
        joinedAt: data.joinedAt?.toDate() || new Date(),
        lastActiveAt: data.lastActiveAt?.toDate() || new Date(),
        streak: data.streak || 0,
      };
    } catch (error) {
      console.error('Failed to get user stats:', error);
      throw new Error('統計情報の取得に失敗しました');
    }
  }

  /**
   * ユーザー統計を更新
   */
  async updateUserStats(
    userId: string,
    updates: Partial<Omit<UserStats, 'userId' | 'joinedAt'>>,
  ): Promise<void> {
    try {
      const currentStats = await this.getUserStats(userId);

      const updatedStats = {
        totalPosts: Math.max(0, currentStats.totalPosts + (updates.totalPosts || 0)),
        totalViews: Math.max(0, currentStats.totalViews + (updates.totalViews || 0)),
        totalFavorites: Math.max(0, currentStats.totalFavorites + (updates.totalFavorites || 0)),
        totalHelpfulVotes: Math.max(
          0,
          currentStats.totalHelpfulVotes + (updates.totalHelpfulVotes || 0),
        ),
        totalBadges: Math.max(0, currentStats.totalBadges + (updates.totalBadges || 0)),
        lastActiveAt: firestore.Timestamp.now(),
        ...(updates.streak !== undefined && { streak: updates.streak }),
      };

      await this.userStatsCollection.doc(userId).update(updatedStats);
    } catch (error) {
      console.error('Failed to update user stats:', error);
    }
  }

  /**
   * 最近のアクティビティを取得（複数ユーザー）
   */
  async getRecentActivities(limit: number = 20): Promise<UserActivity[]> {
    try {
      const snapshot = await this.activitiesCollection
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      const activities: UserActivity[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        activities.push({
          id: doc.id,
          userId: data.userId,
          type: data.type,
          targetId: data.targetId,
          targetTitle: data.targetTitle,
          description: data.description,
          createdAt: data.createdAt.toDate(),
        });
      });

      return activities;
    } catch (error) {
      console.error('Failed to get recent activities:', error);
      return [];
    }
  }

  /**
   * よく見るトイレを取得
   */
  async getFrequentlyViewed(userId: string, limit: number = 10): Promise<ViewHistory[]> {
    try {
      const snapshot = await this.viewHistoryCollection
        .where('userId', '==', userId)
        .orderBy('viewCount', 'desc')
        .limit(limit)
        .get();

      const history: ViewHistory[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        history.push({
          id: doc.id,
          userId: data.userId,
          toiletId: data.toiletId,
          toiletTitle: data.toiletTitle,
          toiletType: data.toiletType,
          viewedAt: data.viewedAt.toDate(),
          viewCount: data.viewCount || 1,
        });
      });

      return history;
    } catch (error) {
      console.error('Failed to get frequently viewed:', error);
      return [];
    }
  }
}

// シングルトンインスタンス
export const historyService = new HistoryService();
