import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { Badge, UserBadges } from '../types/post';
import { badgeService } from '../services/badgeService';
import { useAuth } from '../stores/authStore';

interface UseBadgesState {
  userBadges: UserBadges | null;
  unlockedBadgeDetails: Badge[];
  allBadges: Badge[];
  isLoading: boolean;
  isChecking: boolean;
}

export const useBadges = () => {
  const { user } = useAuth();
  const [state, setState] = useState<UseBadgesState>({
    userBadges: null,
    unlockedBadgeDetails: [],
    allBadges: badgeService.getAllBadges(),
    isLoading: false,
    isChecking: false,
  });

  // ユーザーのバッジ情報を読み込み
  const loadUserBadges = useCallback(async () => {
    if (!user) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const [userBadges, badgeDetails] = await Promise.all([
        badgeService.getUserBadges(user.uid),
        badgeService.getUserBadgeDetails(user.uid),
      ]);

      setState(prev => ({
        ...prev,
        userBadges,
        unlockedBadgeDetails: badgeDetails,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to load user badges:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [user]);

  // バッジ条件をチェック
  const checkBadgeConditions = useCallback(async (): Promise<string[]> => {
    if (!user) return [];

    setState(prev => ({ ...prev, isChecking: true }));

    try {
      const newBadgeIds = await badgeService.checkBadgeConditions(user.uid);

      if (newBadgeIds.length > 0) {
        // 新しいバッジを取得した場合、データを再読み込み
        await loadUserBadges();

        // 新しいバッジ取得の通知
        const newBadges = newBadgeIds
          .map(id => state.allBadges.find(badge => badge.id === id))
          .filter((badge): badge is Badge => badge !== undefined);

        if (newBadges.length === 1) {
          Alert.alert(
            '🎉 新しいバッジを獲得！',
            `「${newBadges[0].name}」\n${newBadges[0].description}`,
            [{ text: 'OK' }],
          );
        } else if (newBadges.length > 1) {
          Alert.alert(
            '🎉 複数のバッジを獲得！',
            `${newBadges.length}個の新しいバッジを獲得しました`,
            [{ text: 'OK' }],
          );
        }
      }

      setState(prev => ({ ...prev, isChecking: false }));
      return newBadgeIds;
    } catch (error) {
      console.error('Failed to check badge conditions:', error);
      setState(prev => ({ ...prev, isChecking: false }));
      return [];
    }
  }, [user, loadUserBadges, state.allBadges]);

  // 投稿時のバッジチェック
  const onToiletPosted = useCallback(
    async (toiletData: any) => {
      if (!user) return;

      try {
        const newBadgeIds = await badgeService.onToiletPosted(user.uid, toiletData);

        if (newBadgeIds.length > 0) {
          await loadUserBadges();

          // 通知表示
          const newBadges = newBadgeIds
            .map(id => state.allBadges.find(badge => badge.id === id))
            .filter((badge): badge is Badge => badge !== undefined);

          for (const badge of newBadges) {
            Alert.alert('🎉 新しいバッジを獲得！', `「${badge.name}」\n${badge.description}`, [
              { text: 'すごい！' },
            ]);
          }
        }
      } catch (error) {
        console.error('Failed to handle toilet posted:', error);
      }
    },
    [user, loadUserBadges, state.allBadges],
  );

  // 投票時のバッジチェック
  const onHelpfulVote = useCallback(
    async (targetUserId: string) => {
      if (!user) return;

      try {
        await badgeService.onHelpfulVote(user.uid, targetUserId);
        // バッジ取得があった可能性があるので、少し遅延してチェック
        setTimeout(() => {
          checkBadgeConditions();
        }, 1000);
      } catch (error) {
        console.error('Failed to handle helpful vote:', error);
      }
    },
    [user, checkBadgeConditions],
  );

  // 初期データの読み込み
  useEffect(() => {
    if (user) {
      loadUserBadges();
    }
  }, [user, loadUserBadges]);

  // 計算値
  const badgeCount = state.userBadges?.unlockedBadges.length || 0;
  const totalBadges = state.allBadges.length;
  const completionRate = totalBadges > 0 ? (badgeCount / totalBadges) * 100 : 0;

  // カテゴリ別の取得数
  const getBadgeCountByCategory = useCallback(
    (category: string) => {
      const categoryBadges = state.allBadges.filter(badge => badge.category === category);
      const unlockedInCategory = state.unlockedBadgeDetails.filter(
        badge => badge.category === category,
      );
      return {
        unlocked: unlockedInCategory.length,
        total: categoryBadges.length,
      };
    },
    [state.allBadges, state.unlockedBadgeDetails],
  );

  // レア度別の取得数
  const getBadgeCountByRarity = useCallback(
    (rarity: string) => {
      const rarityBadges = state.allBadges.filter(badge => badge.rarity === rarity);
      const unlockedInRarity = state.unlockedBadgeDetails.filter(badge => badge.rarity === rarity);
      return {
        unlocked: unlockedInRarity.length,
        total: rarityBadges.length,
      };
    },
    [state.allBadges, state.unlockedBadgeDetails],
  );

  // 特定のバッジが取得済みかチェック
  const hasBadge = useCallback(
    (badgeId: string) => state.userBadges?.unlockedBadges.includes(badgeId) || false,
    [state.userBadges],
  );

  return {
    // 状態
    userBadges: state.userBadges,
    unlockedBadges: state.unlockedBadgeDetails,
    allBadges: state.allBadges,
    isLoading: state.isLoading,
    isChecking: state.isChecking,

    // 計算値
    badgeCount,
    totalBadges,
    completionRate,

    // アクション
    loadUserBadges,
    checkBadgeConditions,
    onToiletPosted,
    onHelpfulVote,
    getBadgeCountByCategory,
    getBadgeCountByRarity,
    hasBadge,
  };
};
