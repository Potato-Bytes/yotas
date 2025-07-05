import firestore from '@react-native-firebase/firestore';
import {
  Report,
  ReportTargetType,
  ReportReason,
  ReportStatus,
  UserRestriction,
  RestrictionType,
  ViolationRecord,
  ViolationType,
  ViolationSeverity,
  AutoRestrictionConfig,
} from '../types/post';

export class ReportService {
  private reportsCollection = firestore().collection('reports');
  private restrictionsCollection = firestore().collection('user_restrictions');
  private violationsCollection = firestore().collection('violation_records');
  private configCollection = firestore().collection('system_config');

  // 自動制限設定（デフォルト値）
  private defaultConfig: AutoRestrictionConfig = {
    maxViolationPoints: 20,
    pointExpirationDays: 30,
    restrictions: {
      3: {
        type: RestrictionType.WARNING,
        message:
          '軽微な違反が検出されました。今後はコミュニティガイドラインに従ってご利用ください。',
      },
      5: {
        type: RestrictionType.POST_RESTRICTION,
        durationDays: 1,
        message: '1日間の投稿制限が適用されました。',
      },
      8: {
        type: RestrictionType.POST_RESTRICTION,
        durationDays: 3,
        message: '3日間の投稿制限が適用されました。',
      },
      12: {
        type: RestrictionType.TEMPORARY_BAN,
        durationDays: 7,
        message: '7日間の利用停止が適用されました。',
      },
      20: {
        type: RestrictionType.PERMANENT_BAN,
        message: 'アカウントが永久停止されました。',
      },
    },
  };

  /**
   * 通報を送信
   */
  async submitReport(
    reporterId: string,
    targetType: ReportTargetType,
    targetId: string,
    reason: ReportReason,
    description?: string,
    evidence?: string[],
  ): Promise<void> {
    try {
      // 同じ対象に対する重複通報をチェック
      const existingReport = await this.reportsCollection
        .where('reporterId', '==', reporterId)
        .where('targetType', '==', targetType)
        .where('targetId', '==', targetId)
        .where('status', 'in', [ReportStatus.PENDING, ReportStatus.UNDER_REVIEW])
        .get();

      if (!existingReport.empty) {
        throw new Error('この対象は既に通報済みです');
      }

      const reportData: Report = {
        id: this.reportsCollection.doc().id,
        reporterId,
        targetType,
        targetId,
        reason,
        description,
        evidence,
        status: ReportStatus.PENDING,
        createdAt: new Date(),
      };

      await this.reportsCollection.add({
        ...reportData,
        createdAt: firestore.Timestamp.now(),
      });

      // 自動検出ロジックの実行
      await this.processAutoDetection(targetType, targetId, reason);
    } catch (error) {
      console.error('Failed to submit report:', error);
      throw error;
    }
  }

  /**
   * 通報一覧を取得（管理者用）
   */
  async getReports(status?: ReportStatus, limit: number = 50): Promise<Report[]> {
    try {
      let query = this.reportsCollection.orderBy('createdAt', 'desc');

      if (status) {
        query = query.where('status', '==', status);
      }

      const snapshot = await query.limit(limit).get();

      const reports: Report[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        reports.push({
          id: doc.id,
          reporterId: data.reporterId,
          targetType: data.targetType,
          targetId: data.targetId,
          reason: data.reason,
          description: data.description,
          evidence: data.evidence,
          status: data.status,
          createdAt: data.createdAt.toDate(),
          reviewedAt: data.reviewedAt?.toDate(),
          reviewerId: data.reviewerId,
          resolution: data.resolution,
        });
      });

      return reports;
    } catch (error) {
      console.error('Failed to get reports:', error);
      return [];
    }
  }

  /**
   * ユーザーの通報履歴を取得
   */
  async getUserReports(userId: string): Promise<Report[]> {
    try {
      const snapshot = await this.reportsCollection
        .where('reporterId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();

      const reports: Report[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        reports.push({
          id: doc.id,
          reporterId: data.reporterId,
          targetType: data.targetType,
          targetId: data.targetId,
          reason: data.reason,
          description: data.description,
          evidence: data.evidence,
          status: data.status,
          createdAt: data.createdAt.toDate(),
          reviewedAt: data.reviewedAt?.toDate(),
          reviewerId: data.reviewerId,
          resolution: data.resolution,
        });
      });

      return reports;
    } catch (error) {
      console.error('Failed to get user reports:', error);
      return [];
    }
  }

  /**
   * 違反記録を追加
   */
  async addViolationRecord(
    userId: string,
    type: ViolationType,
    severity: ViolationSeverity,
    description: string,
    evidence?: string[],
    reportId?: string,
    autoDetected: boolean = false,
  ): Promise<void> {
    try {
      const points = this.getViolationPoints(severity);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.defaultConfig.pointExpirationDays);

      const violationData: ViolationRecord = {
        id: this.violationsCollection.doc().id,
        userId,
        type,
        severity,
        description,
        evidence,
        reportId,
        autoDetected,
        points,
        createdAt: new Date(),
        expiresAt,
      };

      await this.violationsCollection.add({
        ...violationData,
        createdAt: firestore.Timestamp.now(),
        expiresAt: firestore.Timestamp.fromDate(expiresAt),
      });

      // 自動制限判定
      await this.checkAndApplyRestrictions(userId);
    } catch (error) {
      console.error('Failed to add violation record:', error);
      throw error;
    }
  }

  /**
   * ユーザーの違反ポイントを計算
   */
  async getUserViolationPoints(userId: string): Promise<number> {
    try {
      const snapshot = await this.violationsCollection
        .where('userId', '==', userId)
        .where('expiresAt', '>', firestore.Timestamp.now())
        .get();

      let totalPoints = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        totalPoints += data.points || 0;
      });

      return totalPoints;
    } catch (error) {
      console.error('Failed to get user violation points:', error);
      return 0;
    }
  }

  /**
   * ユーザーの制限状況を取得
   */
  async getUserRestrictions(userId: string): Promise<UserRestriction[]> {
    try {
      const snapshot = await this.restrictionsCollection
        .where('userId', '==', userId)
        .where('isActive', '==', true)
        .orderBy('startDate', 'desc')
        .get();

      const restrictions: UserRestriction[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        restrictions.push({
          id: doc.id,
          userId: data.userId,
          type: data.type,
          reason: data.reason,
          startDate: data.startDate.toDate(),
          endDate: data.endDate?.toDate(),
          isActive: data.isActive,
          createdBy: data.createdBy,
          details: data.details,
        });
      });

      // 期限切れの制限を無効化
      for (const restriction of restrictions) {
        if (restriction.endDate && restriction.endDate < new Date()) {
          await this.deactivateRestriction(restriction.id);
        }
      }

      return restrictions.filter(r => !r.endDate || r.endDate > new Date());
    } catch (error) {
      console.error('Failed to get user restrictions:', error);
      return [];
    }
  }

  /**
   * 制限を適用
   */
  private async applyRestriction(
    userId: string,
    type: RestrictionType,
    reason: string,
    durationDays?: number,
    details?: Record<string, any>,
  ): Promise<void> {
    try {
      const startDate = new Date();
      const endDate = durationDays
        ? new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000)
        : undefined;

      const restrictionData: UserRestriction = {
        id: this.restrictionsCollection.doc().id,
        userId,
        type,
        reason,
        startDate,
        endDate,
        isActive: true,
        createdBy: 'system',
        details,
      };

      await this.restrictionsCollection.add({
        ...restrictionData,
        startDate: firestore.Timestamp.fromDate(startDate),
        endDate: endDate ? firestore.Timestamp.fromDate(endDate) : null,
      });

      // TODO: プッシュ通知でユーザーに制限を通知
    } catch (error) {
      console.error('Failed to apply restriction:', error);
    }
  }

  /**
   * 制限を無効化
   */
  private async deactivateRestriction(restrictionId: string): Promise<void> {
    try {
      await this.restrictionsCollection.doc(restrictionId).update({
        isActive: false,
      });
    } catch (error) {
      console.error('Failed to deactivate restriction:', error);
    }
  }

  /**
   * 自動制限判定と適用
   */
  private async checkAndApplyRestrictions(userId: string): Promise<void> {
    try {
      const violationPoints = await this.getUserViolationPoints(userId);

      // 設定された制限ポイントを降順でチェック
      const restrictionPoints = Object.keys(this.defaultConfig.restrictions)
        .map(Number)
        .sort((a, b) => b - a);

      for (const points of restrictionPoints) {
        if (violationPoints >= points) {
          const config = this.defaultConfig.restrictions[points];

          // 既に同じタイプの制限が適用されているかチェック
          const existingRestrictions = await this.getUserRestrictions(userId);
          const hasExistingRestriction = existingRestrictions.some(r => r.type === config.type);

          if (!hasExistingRestriction) {
            await this.applyRestriction(userId, config.type, config.message, config.durationDays, {
              violationPoints,
              triggerPoints: points,
            });
          }
          break;
        }
      }
    } catch (error) {
      console.error('Failed to check and apply restrictions:', error);
    }
  }

  /**
   * 自動検出処理
   */
  private async processAutoDetection(
    targetType: ReportTargetType,
    targetId: string,
    reason: ReportReason,
  ): Promise<void> {
    try {
      // 同じ対象への通報数をカウント
      const reportCount = await this.getReportCountForTarget(targetType, targetId);

      // 通報数が一定以上の場合、自動的に違反とみなす
      if (reportCount >= 3) {
        // 対象のオーナーを特定して違反記録を追加
        const ownerId = await this.getTargetOwnerId(targetType, targetId);
        if (ownerId) {
          let violationType: ViolationType;
          let severity: ViolationSeverity;

          switch (reason) {
            case ReportReason.SPAM:
            case ReportReason.COMMERCIAL_SPAM:
              violationType = ViolationType.SPAM_POSTING;
              severity = ViolationSeverity.MEDIUM;
              break;
            case ReportReason.INAPPROPRIATE_CONTENT:
              violationType = ViolationType.INAPPROPRIATE_CONTENT;
              severity = ViolationSeverity.HIGH;
              break;
            case ReportReason.HARASSMENT:
            case ReportReason.HATE_SPEECH:
              violationType = ViolationType.HARASSMENT;
              severity = ViolationSeverity.HIGH;
              break;
            case ReportReason.FAKE_INFORMATION:
              violationType = ViolationType.FAKE_INFORMATION;
              severity = ViolationSeverity.MEDIUM;
              break;
            default:
              violationType = ViolationType.INAPPROPRIATE_CONTENT;
              severity = ViolationSeverity.LOW;
          }

          await this.addViolationRecord(
            ownerId,
            violationType,
            severity,
            `複数の通報により自動検出: ${reason}`,
            undefined,
            undefined,
            true,
          );
        }
      }
    } catch (error) {
      console.error('Failed to process auto detection:', error);
    }
  }

  /**
   * 対象への通報数を取得
   */
  private async getReportCountForTarget(
    targetType: ReportTargetType,
    targetId: string,
  ): Promise<number> {
    try {
      const snapshot = await this.reportsCollection
        .where('targetType', '==', targetType)
        .where('targetId', '==', targetId)
        .where('status', '!=', ReportStatus.DISMISSED)
        .get();

      return snapshot.size;
    } catch (error) {
      console.error('Failed to get report count:', error);
      return 0;
    }
  }

  /**
   * 対象のオーナーIDを取得
   */
  private async getTargetOwnerId(
    targetType: ReportTargetType,
    targetId: string,
  ): Promise<string | null> {
    try {
      let collection: string;
      switch (targetType) {
        case ReportTargetType.TOILET:
          collection = 'toilets';
          break;
        case ReportTargetType.REVIEW:
          collection = 'reviews';
          break;
        case ReportTargetType.COMMENT:
          collection = 'comments';
          break;
        case ReportTargetType.USER:
          return targetId; // ユーザー自身
        default:
          return null;
      }

      const doc = await firestore().collection(collection).doc(targetId).get();

      if (doc.exists) {
        const data = doc.data()!;
        return data.userId || data.authorId || null;
      }

      return null;
    } catch (error) {
      console.error('Failed to get target owner ID:', error);
      return null;
    }
  }

  /**
   * 違反ポイントを取得
   */
  private getViolationPoints(severity: ViolationSeverity): number {
    switch (severity) {
      case ViolationSeverity.LOW:
        return 1;
      case ViolationSeverity.MEDIUM:
        return 3;
      case ViolationSeverity.HIGH:
        return 6;
      case ViolationSeverity.CRITICAL:
        return 12;
      default:
        return 1;
    }
  }

  /**
   * ユーザーが制限されているかチェック
   */
  async isUserRestricted(
    userId: string,
    action: 'post' | 'comment' | 'review' | 'vote',
  ): Promise<{ restricted: boolean; reason?: string; endDate?: Date }> {
    try {
      const restrictions = await this.getUserRestrictions(userId);

      for (const restriction of restrictions) {
        let isApplicable = false;

        switch (action) {
          case 'post':
            isApplicable = [
              RestrictionType.POST_RESTRICTION,
              RestrictionType.TEMPORARY_BAN,
              RestrictionType.PERMANENT_BAN,
            ].includes(restriction.type);
            break;
          case 'comment':
            isApplicable = [
              RestrictionType.COMMENT_RESTRICTION,
              RestrictionType.TEMPORARY_BAN,
              RestrictionType.PERMANENT_BAN,
            ].includes(restriction.type);
            break;
          case 'review':
            isApplicable = [
              RestrictionType.REVIEW_RESTRICTION,
              RestrictionType.TEMPORARY_BAN,
              RestrictionType.PERMANENT_BAN,
            ].includes(restriction.type);
            break;
          case 'vote':
            isApplicable = [
              RestrictionType.VOTE_RESTRICTION,
              RestrictionType.TEMPORARY_BAN,
              RestrictionType.PERMANENT_BAN,
            ].includes(restriction.type);
            break;
        }

        if (isApplicable) {
          return {
            restricted: true,
            reason: restriction.reason,
            endDate: restriction.endDate,
          };
        }
      }

      return { restricted: false };
    } catch (error) {
      console.error('Failed to check user restriction:', error);
      return { restricted: false };
    }
  }
}

// シングルトンインスタンス
export const reportService = new ReportService();
