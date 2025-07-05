import { useState, useCallback, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import {
  Report,
  UserRestriction,
  ReportTargetType,
  ReportReason,
  ReportStatus,
} from '../types/post';
import { reportService } from '../services/reportService';
import { useAuth } from '../stores/authStore';

interface UseReportState {
  reports: Report[];
  userRestrictions: UserRestriction[];
  violationPoints: number;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
}

export const useReport = () => {
  const { user } = useAuth();
  const [state, setState] = useState<UseReportState>({
    reports: [],
    userRestrictions: [],
    violationPoints: 0,
    isLoading: false,
    isSubmitting: false,
    error: null,
  });

  // 通報を送信
  const submitReport = useCallback(
    async (
      targetType: ReportTargetType,
      targetId: string,
      reason: ReportReason,
      description?: string,
      evidence?: string[],
    ) => {
      if (!user) {
        Alert.alert('エラー', 'ログインが必要です');
        return false;
      }

      setState(prev => ({ ...prev, isSubmitting: true, error: null }));

      try {
        await reportService.submitReport(
          user.uid,
          targetType,
          targetId,
          reason,
          description,
          evidence,
        );

        setState(prev => ({ ...prev, isSubmitting: false }));

        Alert.alert('通報完了', '通報を受け付けました。確認後、適切な対応を行います。', [
          { text: 'OK' },
        ]);

        // ユーザーの通報履歴を更新（別途実行）
        if (user) {
          try {
            const reports = await reportService.getUserReports(user.uid);
            setState(prev => ({ ...prev, reports }));
          } catch (error) {
            console.error('Failed to refresh user reports:', error);
          }
        }

        return true;
      } catch (error) {
        console.error('Failed to submit report:', error);
        setState(prev => ({
          ...prev,
          isSubmitting: false,
          error: error instanceof Error ? error.message : '通報の送信に失敗しました',
        }));

        Alert.alert('エラー', '通報の送信に失敗しました');
        return false;
      }
    },
    [user],
  );

  // ユーザーの通報履歴を読み込み
  const loadUserReports = useCallback(async () => {
    if (!user) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const reports = await reportService.getUserReports(user.uid);
      setState(prev => ({
        ...prev,
        reports,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to load user reports:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: '通報履歴の読み込みに失敗しました',
      }));
    }
  }, [user]);

  // ユーザーの制限状況を読み込み
  const loadUserRestrictions = useCallback(async () => {
    if (!user) return;

    try {
      const restrictions = await reportService.getUserRestrictions(user.uid);
      const violationPoints = await reportService.getUserViolationPoints(user.uid);

      setState(prev => ({
        ...prev,
        userRestrictions: restrictions,
        violationPoints,
      }));
    } catch (error) {
      console.error('Failed to load user restrictions:', error);
    }
  }, [user]);

  // ユーザーが特定のアクションで制限されているかチェック
  const checkRestriction = useCallback(
    async (
      action: 'post' | 'comment' | 'review' | 'vote',
    ): Promise<{ restricted: boolean; reason?: string; endDate?: Date }> => {
      if (!user) {
        return { restricted: false };
      }

      try {
        return await reportService.isUserRestricted(user.uid, action);
      } catch (error) {
        console.error('Failed to check restriction:', error);
        return { restricted: false };
      }
    },
    [user],
  );

  // 制限チェック付きアクション実行
  const executeWithRestrictionCheck = useCallback(
    async (
      action: 'post' | 'comment' | 'review' | 'vote',
      callback: () => Promise<void> | void,
      actionName: string = 'この操作',
    ): Promise<boolean> => {
      const restriction = await checkRestriction(action);

      if (restriction.restricted) {
        const endDateText = restriction.endDate
          ? `制限は${restriction.endDate.toLocaleDateString('ja-JP')}まで有効です。`
          : '';

        Alert.alert(`${actionName}が制限されています`, `${restriction.reason}\n${endDateText}`, [
          { text: 'OK' },
        ]);
        return false;
      }

      try {
        await callback();
        return true;
      } catch (error) {
        console.error('Action failed:', error);
        return false;
      }
    },
    [checkRestriction],
  );

  // メモ化された表示名マッピング
  const reasonDisplayNames = useMemo(
    () => ({
      [ReportReason.INAPPROPRIATE_CONTENT]: '不適切なコンテンツ',
      [ReportReason.SPAM]: 'スパム',
      [ReportReason.HARASSMENT]: '嫌がらせ',
      [ReportReason.FAKE_INFORMATION]: '虚偽情報',
      [ReportReason.COPYRIGHT_VIOLATION]: '著作権侵害',
      [ReportReason.PRIVACY_VIOLATION]: 'プライバシー侵害',
      [ReportReason.COMMERCIAL_SPAM]: '商業的スパム',
      [ReportReason.HATE_SPEECH]: 'ヘイトスピーチ',
      [ReportReason.OTHER]: 'その他',
    }),
    [],
  );

  const statusDisplayNames = useMemo(
    () => ({
      [ReportStatus.PENDING]: '審査待ち',
      [ReportStatus.UNDER_REVIEW]: '審査中',
      [ReportStatus.RESOLVED]: '解決済み',
      [ReportStatus.DISMISSED]: '却下',
      [ReportStatus.AUTO_RESOLVED]: '自動解決',
    }),
    [],
  );

  const statusColors = useMemo(
    () => ({
      [ReportStatus.PENDING]: '#FF9800',
      [ReportStatus.UNDER_REVIEW]: '#2196F3',
      [ReportStatus.RESOLVED]: '#4CAF50',
      [ReportStatus.DISMISSED]: '#757575',
      [ReportStatus.AUTO_RESOLVED]: '#4CAF50',
    }),
    [],
  );

  // 通報理由の表示名を取得
  const getReasonDisplayName = useCallback(
    (reason: ReportReason): string => reasonDisplayNames[reason] || reason,
    [reasonDisplayNames],
  );

  // 通報ステータスの表示名を取得
  const getStatusDisplayName = useCallback(
    (status: ReportStatus): string => statusDisplayNames[status] || status,
    [statusDisplayNames],
  );

  // ステータスの色を取得
  const getStatusColor = useCallback(
    (status: ReportStatus): string => statusColors[status] || '#757575',
    [statusColors],
  );

  // 全データの再読み込み
  const refresh = useCallback(async () => {
    if (!user) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await Promise.all([loadUserReports(), loadUserRestrictions()]);
    } catch (error) {
      console.error('Failed to refresh data:', error);
      setState(prev => ({
        ...prev,
        error: 'データの再読み込みに失敗しました',
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [user, loadUserReports, loadUserRestrictions]);

  // 初期データの読み込み
  useEffect(() => {
    if (user) {
      refresh();
    }
  }, [user, refresh]);

  // メモ化された計算値
  const hasActiveRestrictions = useMemo(
    () => state.userRestrictions.length > 0,
    [state.userRestrictions.length],
  );

  const getActiveRestrictionTypes = useMemo(
    () => state.userRestrictions.map(r => r.type),
    [state.userRestrictions],
  );

  const isNearViolationLimit = useMemo(
    () => state.violationPoints >= 15, // 20ポイントで永久停止なので警告
    [state.violationPoints],
  );

  const reportCount = useMemo(() => state.reports.length, [state.reports.length]);
  const activeRestrictionCount = useMemo(
    () => state.userRestrictions.length,
    [state.userRestrictions.length],
  );
  const isHighRiskUser = useMemo(() => state.violationPoints >= 10, [state.violationPoints]);

  return {
    // 状態
    reports: state.reports,
    userRestrictions: state.userRestrictions,
    violationPoints: state.violationPoints,
    isLoading: state.isLoading,
    isSubmitting: state.isSubmitting,
    error: state.error,

    // アクション
    submitReport,
    loadUserReports,
    loadUserRestrictions,
    checkRestriction,
    executeWithRestrictionCheck,
    refresh,

    // ヘルパー関数
    getReasonDisplayName,
    getStatusDisplayName,
    getStatusColor,

    // 計算値（メモ化済み）
    hasActiveRestrictions,
    getActiveRestrictionTypes,
    isNearViolationLimit,
    reportCount,
    activeRestrictionCount,
    isHighRiskUser,
  };
};
