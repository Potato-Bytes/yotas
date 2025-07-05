import firestore from '@react-native-firebase/firestore';
import { Badge, UserBadges, BadgeCategory, BadgeRarity } from '../types/post';
import { BADGES } from '../data/badges';

export class BadgeService {
  private userBadgesCollection = firestore().collection('user_badges');
  private userStatsCollection = firestore().collection('user_stats');

  /**
   * ユーザーのバッジ情報を取得
   */
  async getUserBadges(userId: string): Promise<UserBadges> {
    try {
      const doc = await this.userBadgesCollection.doc(userId).get();

      if (!doc.exists) {
        // 新規ユーザーの場合、初期データを作成
        const initialData: UserBadges = {
          userId,
          unlockedBadges: [],
          progress: {},
          lastChecked: new Date(),
        };

        await this.userBadgesCollection.doc(userId).set({
          ...initialData,
          lastChecked: firestore.Timestamp.now(),
        });

        return initialData;
      }

      const data = doc.data()!;
      return {
        userId: data.userId,
        unlockedBadges: data.unlockedBadges || [],
        progress: data.progress || {},
        lastChecked: data.lastChecked?.toDate() || new Date(),
      };
    } catch (error) {
      console.error('Failed to get user badges:', error);
      throw new Error('バッジ情報の取得に失敗しました');
    }
  }

  /**
   * ユーザーの統計情報を取得
   */
  async getUserStats(userId: string): Promise<Record<string, number>> {
    try {
      const doc = await this.userStatsCollection.doc(userId).get();

      if (!doc.exists) {
        return {};
      }

      return doc.data() || {};
    } catch (error) {
      console.error('Failed to get user stats:', error);
      return {};
    }
  }

  /**
   * ユーザーの統計情報を更新
   */
  async updateUserStats(userId: string, stats: Record<string, number>): Promise<void> {
    try {
      await this.userStatsCollection.doc(userId).set(stats, { merge: true });
    } catch (error) {
      console.error('Failed to update user stats:', error);
      throw new Error('統計情報の更新に失敗しました');
    }
  }

  /**
   * バッジ取得条件をチェック
   */
  async checkBadgeConditions(userId: string): Promise<string[]> {
    try {
      const [userBadges, userStats] = await Promise.all([
        this.getUserBadges(userId),
        this.getUserStats(userId),
      ]);

      const newBadges: string[] = [];

      for (const badge of BADGES) {
        // 既に取得済みのバッジはスキップ
        if (userBadges.unlockedBadges.includes(badge.id)) {
          continue;
        }

        const isUnlocked = this.evaluateBadgeCondition(badge, userStats, userBadges);

        if (isUnlocked) {
          newBadges.push(badge.id);
        }
      }

      // 新しいバッジがある場合、バッジ情報を更新
      if (newBadges.length > 0) {
        await this.unlockBadges(userId, newBadges);
      }

      return newBadges;
    } catch (error) {
      console.error('Failed to check badge conditions:', error);
      return [];
    }
  }

  /**
   * バッジの取得条件を評価
   */
  private evaluateBadgeCondition(
    badge: Badge,
    userStats: Record<string, number>,
    _userBadges: UserBadges,
  ): boolean {
    const { condition } = badge;
    const currentValue = userStats[condition.target] || 0;

    switch (condition.type) {
      case 'count':
        return currentValue >= condition.value;

      case 'rating':
        // 最小投稿数チェック（品質系バッジ）
        if (condition.target === 'helpful_ratio' || condition.target.includes('avg_')) {
          const minPosts = userStats.toilets_posted || 0;
          if (minPosts < 10) return false;
        }
        return currentValue >= condition.value;

      case 'streak':
        // 連続記録系（実装は簡略化）
        return currentValue >= condition.value;

      case 'special':
        // 特別条件（手動付与や特殊ロジック）
        return this.evaluateSpecialCondition(condition.target, condition.value, userStats);

      default:
        return false;
    }
  }

  /**
   * 特別条件の評価
   */
  private evaluateSpecialCondition(
    target: string,
    value: number,
    userStats: Record<string, number>,
  ): boolean {
    switch (target) {
      case 'registration_date':
        // アーリーアダプター判定（ユーザーIDベース等）
        return (userStats.user_number || 999999) <= value;

      case 'monthly_ranking':
        // 月間ランキング1位
        return (userStats.monthly_rank || 999) === value;

      case 'perfect_rating_post':
        // パーフェクト評価の投稿数
        return (userStats.perfect_posts || 0) >= value;

      case 'manual_award':
        // 手動付与フラグ
        return (userStats.legend_awarded || 0) >= value;

      default:
        return false;
    }
  }

  /**
   * バッジを取得済みにマーク
   */
  async unlockBadges(userId: string, badgeIds: string[]): Promise<void> {
    try {
      const userBadges = await this.getUserBadges(userId);

      const updatedBadges = {
        ...userBadges,
        unlockedBadges: [...userBadges.unlockedBadges, ...badgeIds],
        lastChecked: firestore.Timestamp.now(),
      };

      await this.userBadgesCollection.doc(userId).set(updatedBadges, { merge: true });
    } catch (error) {
      console.error('Failed to unlock badges:', error);
      throw new Error('バッジの取得に失敗しました');
    }
  }

  /**
   * ユーザーの取得済みバッジ詳細を取得
   */
  async getUserBadgeDetails(userId: string): Promise<Badge[]> {
    try {
      const userBadges = await this.getUserBadges(userId);

      return userBadges.unlockedBadges
        .map(badgeId => BADGES.find(badge => badge.id === badgeId))
        .filter((badge): badge is Badge => badge !== undefined)
        .map(badge => ({
          ...badge,
          unlockedAt: new Date(), // 実際の実装では取得日時を保存
        }));
    } catch (error) {
      console.error('Failed to get user badge details:', error);
      return [];
    }
  }

  /**
   * ユーザーのバッジ進捗を更新
   */
  async updateBadgeProgress(userId: string, target: string, value: number): Promise<void> {
    try {
      await this.updateUserStats(userId, { [target]: value });

      // バッジ条件をチェックして新しいバッジがあるか確認
      await this.checkBadgeConditions(userId);
    } catch (error) {
      console.error('Failed to update badge progress:', error);
    }
  }

  /**
   * 投稿時の統計更新
   */
  async onToiletPosted(userId: string, toiletData: any): Promise<string[]> {
    try {
      const userStats = await this.getUserStats(userId);

      const updatedStats: Record<string, any> = {
        ...userStats,
        toilets_posted: (userStats.toilets_posted || 0) + 1,
        accessible_toilets_posted: toiletData.isAccessible
          ? (userStats.accessible_toilets_posted || 0) + 1
          : userStats.accessible_toilets_posted || 0,
      };

      // 地域とタイプの追跡
      const postedAreas = userStats.posted_areas && typeof userStats.posted_areas === 'string' ? JSON.parse(userStats.posted_areas) : [];
      const postedTypes = userStats.posted_types && typeof userStats.posted_types === 'string' ? JSON.parse(userStats.posted_types) : [];

      if (toiletData.area && !postedAreas.includes(toiletData.area)) {
        postedAreas.push(toiletData.area);
        updatedStats.unique_areas_posted = postedAreas.length;
        updatedStats.posted_areas = JSON.stringify(postedAreas);
      }

      if (!postedTypes.includes(toiletData.type)) {
        postedTypes.push(toiletData.type);
        updatedStats.toilet_types_posted = postedTypes.length;
        updatedStats.posted_types = JSON.stringify(postedTypes);
      }

      await this.updateUserStats(userId, updatedStats);

      // バッジ条件チェック
      return await this.checkBadgeConditions(userId);
    } catch (error) {
      console.error('Failed to handle toilet posted event:', error);
      return [];
    }
  }

  /**
   * 投票時の統計更新
   */
  async onHelpfulVote(voterId: string, targetUserId: string): Promise<void> {
    try {
      // 投票者の統計更新
      const voterStats = await this.getUserStats(voterId);
      await this.updateUserStats(voterId, {
        ...voterStats,
        helpful_votes_given: (voterStats.helpful_votes_given || 0) + 1,
      });

      // 投稿者の統計更新
      const targetStats = await this.getUserStats(targetUserId);
      await this.updateUserStats(targetUserId, {
        ...targetStats,
        helpful_votes_received: (targetStats.helpful_votes_received || 0) + 1,
      });

      // 両者のバッジ条件チェック
      await Promise.all([
        this.checkBadgeConditions(voterId),
        this.checkBadgeConditions(targetUserId),
      ]);
    } catch (error) {
      console.error('Failed to handle helpful vote event:', error);
    }
  }

  /**
   * 全バッジの取得
   */
  getAllBadges(): Badge[] {
    return BADGES;
  }

  /**
   * カテゴリ別バッジの取得
   */
  getBadgesByCategory(category: BadgeCategory): Badge[] {
    return BADGES.filter(badge => badge.category === category);
  }

  /**
   * レア度別バッジの取得
   */
  getBadgesByRarity(rarity: BadgeRarity): Badge[] {
    return BADGES.filter(badge => badge.rarity === rarity);
  }
}

// シングルトンインスタンス
export const badgeService = new BadgeService();
