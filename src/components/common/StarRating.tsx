import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  onRatingChange?: (rating: number) => void;
  size?: number;
  color?: string;
  disabled?: boolean;
  showValue?: boolean;
  required?: boolean;
  label?: string;
  description?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  onRatingChange,
  size = 24,
  color = '#FFD700',
  disabled = false,
  showValue = true,
  required = false,
  label,
  description,
}) => {
  const handleStarPress = useCallback(
    (starRating: number) => {
      if (!disabled && onRatingChange) {
        onRatingChange(starRating);
      }
    },
    [disabled, onRatingChange],
  );

  // メモ化された評価値表示
  const displayRating = useMemo(() => (rating > 0 ? `${rating.toFixed(1)}` : '未評価'), [rating]);

  // メモ化された星の配列
  const stars = useMemo(
    () =>
      Array.from({ length: maxRating }, (_, index) => {
        const starNumber = index + 1;
        const isFilled = starNumber <= rating;
        const isHalfFilled = starNumber - 0.5 === rating;

        return (
          <TouchableOpacity
            key={starNumber}
            style={[styles.star, { width: size, height: size }]}
            onPress={() => handleStarPress(starNumber)}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.starText,
                {
                  fontSize: size,
                  color: isFilled || isHalfFilled ? color : '#E0E0E0',
                },
              ]}
            >
              {isFilled ? '★' : isHalfFilled ? '☆' : '☆'}
            </Text>
          </TouchableOpacity>
        );
      }),
    [maxRating, rating, size, color, disabled, handleStarPress],
  );

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
          {description && <Text style={styles.description}>{description}</Text>}
        </View>
      )}

      <View style={styles.ratingContainer}>
        <View style={styles.starsContainer}>{stars}</View>

        {showValue && <Text style={styles.ratingValue}>{displayRating}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  labelContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  required: {
    color: '#ff4757',
  },
  description: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 12,
  },
  star: {
    marginRight: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  starText: {
    textAlign: 'center',
    lineHeight: undefined, // デフォルトにリセット
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    minWidth: 45,
  },
});

// React.memo with custom comparison for performance optimization
export default React.memo(
  StarRating,
  (prevProps, nextProps) =>
    prevProps.rating === nextProps.rating &&
    prevProps.maxRating === nextProps.maxRating &&
    prevProps.size === nextProps.size &&
    prevProps.color === nextProps.color &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.showValue === nextProps.showValue &&
    prevProps.required === nextProps.required &&
    prevProps.label === nextProps.label &&
    prevProps.description === nextProps.description &&
    prevProps.onRatingChange === nextProps.onRatingChange,
);
