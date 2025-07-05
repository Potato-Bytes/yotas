import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Badge, BadgeRarity } from '../../types/post';
import { RARITY_COLORS, CATEGORY_COLORS } from '../../data/badges';

interface BadgeItemProps {
  badge: Badge;
  unlocked: boolean;
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
  showDetails?: boolean;
}

const BadgeItem: React.FC<BadgeItemProps> = ({
  badge,
  unlocked,
  size = 'medium',
  onPress,
  showDetails = false,
}) => {
  const sizeConfig = {
    small: {
      container: 60,
      icon: 24,
      fontSize: 10,
    },
    medium: {
      container: 80,
      icon: 32,
      fontSize: 12,
    },
    large: {
      container: 100,
      icon: 40,
      fontSize: 14,
    },
  };

  const config = sizeConfig[size];
  const rarityColor = RARITY_COLORS[badge.rarity];
  const categoryColor = CATEGORY_COLORS[badge.category];

  const containerStyle = [
    styles.container,
    {
      width: config.container,
      height: config.container,
    },
    unlocked ? {
      borderColor: rarityColor,
      backgroundColor: `${rarityColor}15`,
    } : styles.lockedContainerColors,
    !unlocked && styles.lockedContainer,
  ];

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component style={containerStyle} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      {/* バッジアイコン */}
      <Text
        style={[
          styles.icon,
          {
            fontSize: config.icon,
          },
          unlocked ? styles.unlockedIcon : styles.lockedIcon,
        ]}
      >
        {badge.icon}
      </Text>

      {/* レア度インジケーター */}
      <View
        style={[
          styles.rarityIndicator,
          unlocked ? { backgroundColor: rarityColor } : styles.lockedRarityIndicator,
        ]}
      />

      {/* バッジ名 */}
      <Text
        style={[
          styles.name,
          {
            fontSize: config.fontSize,
          },
          unlocked ? styles.unlockedName : styles.lockedName,
        ]}
        numberOfLines={2}
      >
        {badge.name}
      </Text>

      {/* ロック状態 */}
      {!unlocked && (
        <View style={styles.lockOverlay}>
          <Text style={styles.lockIcon}>🔒</Text>
        </View>
      )}

      {/* 詳細情報 */}
      {showDetails && (
        <View style={styles.detailsContainer}>
          <Text style={styles.description} numberOfLines={3}>
            {badge.description}
          </Text>

          <View style={styles.metaContainer}>
            <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
              <Text style={styles.categoryText}>{getCategoryDisplayName(badge.category)}</Text>
            </View>

            <Text style={styles.rarityText}>{getRarityDisplayName(badge.rarity)}</Text>
          </View>

          {badge.unlockedAt && (
            <Text style={styles.unlockedDate}>取得日: {badge.unlockedAt.toLocaleDateString()}</Text>
          )}
        </View>
      )}
    </Component>
  );
};

// カテゴリ表示名
const getCategoryDisplayName = (category: string): string => {
  const categoryNames = {
    posting: '投稿',
    reviewing: 'レビュー',
    exploration: '探索',
    community: 'コミュニティ',
    special: '特別',
  };
  return categoryNames[category as keyof typeof categoryNames] || category;
};

// レア度表示名
const getRarityDisplayName = (rarity: BadgeRarity): string => {
  const rarityNames = {
    [BadgeRarity.COMMON]: 'コモン',
    [BadgeRarity.UNCOMMON]: 'アンコモン',
    [BadgeRarity.RARE]: 'レア',
    [BadgeRarity.EPIC]: 'エピック',
    [BadgeRarity.LEGENDARY]: 'レジェンダリー',
  };
  return rarityNames[rarity];
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  lockedContainer: {
    opacity: 0.6,
  },
  lockedContainerColors: {
    borderColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
  },
  unlockedIcon: {
    opacity: 1,
  },
  lockedIcon: {
    opacity: 0.3,
  },
  lockedRarityIndicator: {
    backgroundColor: '#ccc',
  },
  unlockedName: {
    color: '#333',
  },
  lockedName: {
    color: '#999',
  },
  icon: {
    textAlign: 'center',
    marginBottom: 4,
  },
  rarityIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  name: {
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 14,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
  },
  lockIcon: {
    fontSize: 16,
    opacity: 0.7,
  },
  detailsContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    width: '100%',
  },
  description: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  rarityText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  unlockedDate: {
    fontSize: 10,
    color: '#999',
    textAlign: 'right',
  },
});

export default BadgeItem;
