import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Report, ReportTargetType, ReportStatus } from '../../types/post';
import { useReport } from '../../hooks/useReport';

interface ReportItemProps {
  item: Report;
  onPress: (report: Report) => void;
  getReasonDisplayName: (reason: any) => string;
  getStatusDisplayName: (status: ReportStatus) => string;
  getStatusColor: (status: ReportStatus) => string;
}

const ReportItem: React.FC<ReportItemProps> = ({
  item,
  onPress,
  getReasonDisplayName,
  getStatusDisplayName,
  getStatusColor,
}) => {
  const getTargetTypeIcon = (type: ReportTargetType) => {
    switch (type) {
      case ReportTargetType.TOILET:
        return '🚽';
      case ReportTargetType.REVIEW:
        return '⭐';
      case ReportTargetType.USER:
        return '👤';
      case ReportTargetType.COMMENT:
        return '💬';
      default:
        return '📝';
    }
  };

  const getTargetTypeDisplayName = (type: ReportTargetType) => {
    const names = {
      [ReportTargetType.TOILET]: 'トイレ投稿',
      [ReportTargetType.REVIEW]: 'レビュー',
      [ReportTargetType.USER]: 'ユーザー',
      [ReportTargetType.COMMENT]: 'コメント',
    };
    return names[type] || type;
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <TouchableOpacity style={styles.reportItem} onPress={() => onPress(item)} activeOpacity={0.7}>
      <View style={styles.reportHeader}>
        <View style={styles.targetInfo}>
          <Text style={styles.targetIcon}>{getTargetTypeIcon(item.targetType)}</Text>
          <Text style={styles.targetType}>{getTargetTypeDisplayName(item.targetType)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusDisplayName(item.status)}</Text>
        </View>
      </View>

      <Text style={styles.reasonText}>理由: {getReasonDisplayName(item.reason)}</Text>

      {item.description && (
        <Text style={styles.descriptionText} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.reportFooter}>
        <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
        <Icon name="chevron-forward" size={16} color="#ccc" />
      </View>
    </TouchableOpacity>
  );
};

const ReportHistoryScreen: React.FC = () => {
  const {
    reports,
    userRestrictions,
    violationPoints,
    isLoading,
    error,
    getReasonDisplayName,
    getStatusDisplayName,
    getStatusColor,
    hasActiveRestrictions,
    isNearViolationLimit,
    refresh,
  } = useReport();

  const handleReportPress = useCallback(
    (report: Report) => {
      Alert.alert(
        '通報詳細',
        `ID: ${report.id}\n` +
          `対象: ${report.targetType}\n` +
          `理由: ${getReasonDisplayName(report.reason)}\n` +
          `状態: ${getStatusDisplayName(report.status)}\n` +
          `日時: ${report.createdAt.toLocaleString('ja-JP')}${
            report.description ? `\n詳細: ${report.description}` : ''
          }${report.resolution ? `\n処理結果: ${report.resolution}` : ''}`,
        [{ text: 'OK' }],
      );
    },
    [getReasonDisplayName, getStatusDisplayName],
  );

  const renderReportItem = ({ item }: { item: Report }) => (
    <ReportItem
      item={item}
      onPress={handleReportPress}
      getReasonDisplayName={getReasonDisplayName}
      getStatusDisplayName={getStatusDisplayName}
      getStatusColor={getStatusColor}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="flag-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>通報履歴がありません</Text>
      <Text style={styles.emptyDescription}>
        問題のあるコンテンツを発見した場合は、通報機能をご利用ください
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* 違反ポイント表示 */}
      <View style={styles.pointsCard}>
        <View style={styles.pointsHeader}>
          <Icon name="alert-circle-outline" size={20} color="#666" />
          <Text style={styles.pointsTitle}>違反ポイント</Text>
        </View>
        <View style={styles.pointsContent}>
          <Text style={[styles.pointsValue, isNearViolationLimit() && styles.dangerPoints]}>
            {violationPoints} / 20
          </Text>
          <View style={styles.pointsBar}>
            <View
              style={[
                styles.pointsProgress,
                {
                  width: `${Math.min((violationPoints / 20) * 100, 100)}%`,
                  backgroundColor: isNearViolationLimit() ? '#f44336' : '#4285f4',
                },
              ]}
            />
          </View>
        </View>
        {isNearViolationLimit() && (
          <Text style={styles.warningText}>
            ⚠️ 違反ポイントが高くなっています。20ポイントで永久停止となります。
          </Text>
        )}
      </View>

      {/* アクティブな制限表示 */}
      {hasActiveRestrictions() && (
        <View style={styles.restrictionsCard}>
          <View style={styles.restrictionsHeader}>
            <Icon name="lock-closed" size={20} color="#f44336" />
            <Text style={styles.restrictionsTitle}>利用制限</Text>
          </View>
          {userRestrictions.map(restriction => (
            <View key={restriction.id} style={styles.restrictionItem}>
              <Text style={styles.restrictionType}>
                {getRestrictionTypeDisplayName(restriction.type)}
              </Text>
              <Text style={styles.restrictionReason}>{restriction.reason}</Text>
              {restriction.endDate && (
                <Text style={styles.restrictionEndDate}>
                  {restriction.endDate.toLocaleDateString('ja-JP')}まで
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* 統計情報 */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>通報統計</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{reports.length}</Text>
            <Text style={styles.statLabel}>総通報数</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {reports.filter(r => r.status === 'resolved' || r.status === 'auto_resolved').length}
            </Text>
            <Text style={styles.statLabel}>解決済み</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {reports.filter(r => r.status === 'pending' || r.status === 'under_review').length}
            </Text>
            <Text style={styles.statLabel}>審査中</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>通報履歴</Text>
    </View>
  );

  const getRestrictionTypeDisplayName = (type: string): string => {
    const names: { [key: string]: string } = {
      post_restriction: '投稿制限',
      comment_restriction: 'コメント制限',
      review_restriction: 'レビュー制限',
      vote_restriction: '投票制限',
      temporary_ban: '一時停止',
      permanent_ban: '永久停止',
      warning: '警告',
    };
    return names[type] || type;
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={reports}
        renderItem={renderReportItem}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={reports.length === 0 ? renderEmptyState : null}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={reports.length === 0 ? styles.emptyList : undefined}
      />

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    padding: 16,
  },
  pointsCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  pointsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pointsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  pointsContent: {
    marginBottom: 8,
  },
  pointsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  dangerPoints: {
    color: '#f44336',
  },
  pointsBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  pointsProgress: {
    height: '100%',
    borderRadius: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#f44336',
    marginTop: 8,
    lineHeight: 16,
  },
  restrictionsCard: {
    backgroundColor: '#ffebee',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  restrictionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  restrictionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f44336',
    marginLeft: 8,
  },
  restrictionItem: {
    marginBottom: 8,
  },
  restrictionType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  restrictionReason: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  restrictionEndDate: {
    fontSize: 12,
    color: '#f44336',
    marginTop: 2,
  },
  statsCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4285f4',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  reportItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  targetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  targetType: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  reasonText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginBottom: 8,
  },
  reportFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
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
});

export default ReportHistoryScreen;
