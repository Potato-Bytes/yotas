import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useHelpful } from '../../hooks/useHelpful';

interface HelpfulVotingProps {
  toiletId: string;
  size?: 'small' | 'medium' | 'large';
  showStats?: boolean;
  showText?: boolean;
}

const HelpfulVoting: React.FC<HelpfulVotingProps> = ({
  toiletId,
  size = 'medium',
  showStats = true,
  showText = true,
}) => {
  const {
    stats,
    isLoading,
    isVoting,
    userVotedHelpful,
    userVotedNotHelpful,
    voteHelpful,
    voteNotHelpful,
    removeVote,
  } = useHelpful(toiletId);

  // メモ化されたサイズ設定
  const config = useMemo(() => {
    const sizeConfig = {
      small: {
        iconSize: 16,
        fontSize: 12,
        padding: 6,
        gap: 8,
      },
      medium: {
        iconSize: 20,
        fontSize: 14,
        padding: 8,
        gap: 12,
      },
      large: {
        iconSize: 24,
        fontSize: 16,
        padding: 10,
        gap: 16,
      },
    };
    return sizeConfig[size];
  }, [size]);

  // メモ化されたボタンハンドラー
  const handleHelpfulPress = useCallback(() => {
    if (userVotedHelpful) {
      removeVote();
    } else {
      voteHelpful();
    }
  }, [userVotedHelpful, removeVote, voteHelpful]);

  const handleNotHelpfulPress = useCallback(() => {
    if (userVotedNotHelpful) {
      removeVote();
    } else {
      voteNotHelpful();
    }
  }, [userVotedNotHelpful, removeVote, voteNotHelpful]);

  // メモ化された統計計算
  const helpfulPercentage = useMemo(
    () => (stats.totalVotes > 0 ? Math.round(stats.helpfulRatio * 100) : 0),
    [stats.helpfulRatio, stats.totalVotes],
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { gap: config.gap }]}>
        <ActivityIndicator size="small" color="#666" />
        {showText && (
          <Text style={[styles.loadingText, { fontSize: config.fontSize }]}>読み込み中...</Text>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { gap: config.gap }]}>
      {/* 役に立ったボタン */}
      <TouchableOpacity
        style={[
          styles.voteButton,
          {
            padding: config.padding,
            backgroundColor: userVotedHelpful ? '#4CAF50' : '#f5f5f5',
          },
          isVoting && styles.disabledButton,
        ]}
        onPress={handleHelpfulPress}
        disabled={isVoting}
        activeOpacity={0.7}
      >
        <Icon name="thumbs-up" size={config.iconSize} color={userVotedHelpful ? '#fff' : '#666'} />
        {showText && (
          <Text
            style={[
              styles.voteText,
              {
                fontSize: config.fontSize,
                color: userVotedHelpful ? '#fff' : '#666',
              },
            ]}
          >
            役に立った
          </Text>
        )}
        {showStats && (
          <Text
            style={[
              styles.countText,
              {
                fontSize: config.fontSize - 2,
                color: userVotedHelpful ? '#fff' : '#999',
              },
            ]}
          >
            {stats.helpfulCount}
          </Text>
        )}
      </TouchableOpacity>

      {/* 役に立たなかったボタン */}
      <TouchableOpacity
        style={[
          styles.voteButton,
          {
            padding: config.padding,
            backgroundColor: userVotedNotHelpful ? '#f44336' : '#f5f5f5',
          },
          isVoting && styles.disabledButton,
        ]}
        onPress={handleNotHelpfulPress}
        disabled={isVoting}
        activeOpacity={0.7}
      >
        <Icon
          name="thumbs-down"
          size={config.iconSize}
          color={userVotedNotHelpful ? '#fff' : '#666'}
        />
        {showText && (
          <Text
            style={[
              styles.voteText,
              {
                fontSize: config.fontSize,
                color: userVotedNotHelpful ? '#fff' : '#666',
              },
            ]}
          >
            役に立たなかった
          </Text>
        )}
        {showStats && (
          <Text
            style={[
              styles.countText,
              {
                fontSize: config.fontSize - 2,
                color: userVotedNotHelpful ? '#fff' : '#999',
              },
            ]}
          >
            {stats.notHelpfulCount}
          </Text>
        )}
      </TouchableOpacity>

      {/* 統計情報（詳細） */}
      {showStats && stats.totalVotes > 0 && (
        <View style={styles.statsContainer}>
          <Text style={[styles.statsText, { fontSize: config.fontSize - 2 }]}>
            {stats.totalVotes}人中{stats.helpfulCount}人が役に立ったと回答
          </Text>
          <Text style={[styles.ratioText, { fontSize: config.fontSize - 2 }]}>
            ({helpfulPercentage}%が役に立った)
          </Text>
        </View>
      )}

      {/* 投票中のローディング */}
      {isVoting && (
        <View style={styles.votingOverlay}>
          <ActivityIndicator size="small" color="#4285f4" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  voteText: {
    fontWeight: '500',
  },
  countText: {
    fontWeight: '600',
    marginLeft: 2,
  },
  loadingText: {
    color: '#666',
  },
  statsContainer: {
    marginLeft: 8,
    alignItems: 'flex-start',
  },
  statsText: {
    color: '#666',
  },
  ratioText: {
    color: '#999',
    fontSize: 11,
  },
  votingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
  },
});

// React.memo with custom comparison for performance optimization
export default React.memo(
  HelpfulVoting,
  (prevProps, nextProps) =>
    prevProps.toiletId === nextProps.toiletId &&
    prevProps.size === nextProps.size &&
    prevProps.showStats === nextProps.showStats &&
    prevProps.showText === nextProps.showText,
);
