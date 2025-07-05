import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { HelpfulVote, HelpfulStats } from '../types/post';
import { helpfulService } from '../services/helpfulService';
import { useAuth } from '../stores/authStore';

interface UseHelpfulState {
  userVote: HelpfulVote | null;
  stats: HelpfulStats;
  isLoading: boolean;
  isVoting: boolean;
}

export const useHelpful = (toiletId: string) => {
  const { user } = useAuth();
  const [state, setState] = useState<UseHelpfulState>({
    userVote: null,
    stats: {
      helpfulCount: 0,
      notHelpfulCount: 0,
      totalVotes: 0,
      helpfulRatio: 0,
    },
    isLoading: true,
    isVoting: false,
  });

  // データの読み込み
  const loadData = useCallback(async () => {
    if (!toiletId) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const [userVote, stats] = await Promise.all([
        user ? helpfulService.getUserVote(user.uid, toiletId) : null,
        helpfulService.getHelpfulStats(toiletId),
      ]);

      setState(prev => ({
        ...prev,
        userVote,
        stats,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to load helpful data:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [toiletId, user]);

  // 投票する
  const vote = useCallback(
    async (isHelpful: boolean) => {
      if (!user) {
        Alert.alert('ログインが必要です', '投票するにはログインしてください');
        return;
      }

      setState(prev => ({ ...prev, isVoting: true }));

      try {
        await helpfulService.vote(user.uid, toiletId, isHelpful);

        // データを再読み込み
        await loadData();

        setState(prev => ({ ...prev, isVoting: false }));
      } catch (error) {
        console.error('Failed to vote:', error);
        Alert.alert('エラー', '投票に失敗しました。もう一度お試しください。');
        setState(prev => ({ ...prev, isVoting: false }));
      }
    },
    [user, toiletId, loadData],
  );

  // 投票を取り消す
  const removeVote = useCallback(async () => {
    if (!user) {
      return;
    }

    setState(prev => ({ ...prev, isVoting: true }));

    try {
      await helpfulService.removeVote(user.uid, toiletId);

      // データを再読み込み
      await loadData();

      setState(prev => ({ ...prev, isVoting: false }));
    } catch (error) {
      console.error('Failed to remove vote:', error);
      Alert.alert('エラー', '投票の取り消しに失敗しました。もう一度お試しください。');
      setState(prev => ({ ...prev, isVoting: false }));
    }
  }, [user, toiletId, loadData]);

  // 「役に立った」に投票
  const voteHelpful = useCallback(() => {
    vote(true);
  }, [vote]);

  // 「役に立たなかった」に投票
  const voteNotHelpful = useCallback(() => {
    vote(false);
  }, [vote]);

  // 初期データの読み込み
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    // 状態
    userVote: state.userVote,
    stats: state.stats,
    isLoading: state.isLoading,
    isVoting: state.isVoting,

    // 計算値
    hasVoted: state.userVote !== null,
    userVotedHelpful: state.userVote?.isHelpful === true,
    userVotedNotHelpful: state.userVote?.isHelpful === false,

    // アクション
    voteHelpful,
    voteNotHelpful,
    removeVote,
    refresh: loadData,
  };
};
