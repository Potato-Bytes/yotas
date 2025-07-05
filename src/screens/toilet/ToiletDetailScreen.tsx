import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  SafeAreaView,
  Dimensions,
  Share,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ToiletLocation } from '../../types/maps';
import { firestoreService } from '../../services/firestoreService';
// Utility functions available for future use
// import { getToiletIcon, getToiletTypeColor } from '../../utils/mapUtils';
import { toiletTypeOptions, facilityLabels, facilityIcons } from '../../types/post';
import HelpfulVoting from '../../components/post/HelpfulVoting';
// import StarRating from '../../components/common/StarRating'; // Available for future use

type RootStackParamList = {
  ToiletDetail: { toiletId: string };
};

type ToiletDetailScreenRouteProp = RouteProp<RootStackParamList, 'ToiletDetail'>;
type ToiletDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ToiletDetail'>;

interface Props {
  route: ToiletDetailScreenRouteProp;
  navigation: ToiletDetailScreenNavigationProp;
}

const { width: screenWidth } = Dimensions.get('window');

const ToiletDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { toiletId } = route.params;
  const [toilet, setToilet] = useState<ToiletLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // トイレ詳細データの読み込み
  const loadToiletDetail = useCallback(async () => {
    setIsLoading(true);
    try {
      const toiletData = await firestoreService.getToilet(toiletId);
      setToilet(toiletData);
    } catch (error) {
      console.error('Failed to load toilet detail:', error);
      Alert.alert('エラー', 'トイレ情報の読み込みに失敗しました');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  }, [toiletId, navigation]);

  // シェア機能
  const handleShare = useCallback(async () => {
    if (!toilet) return;

    try {
      await Share.share({
        message: `${toilet.title}\n${toilet.description}\n\n#yotas #トイレ情報`,
        title: toilet.title,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  }, [toilet]);

  // 初期データ読み込み
  useEffect(() => {
    loadToiletDetail();
  }, [loadToiletDetail]);

  const selectedToiletType = toiletTypeOptions.find(option => option.value === toilet?.type);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!toilet) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text>トイレ情報が見つかりません</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>戻る</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {toilet.title}
        </Text>
        <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
          <Icon name="share-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 画像ギャラリー */}
        {toilet.images && toilet.images.length > 0 && (
          <View style={styles.imageSection}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={event => {
                const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
                setSelectedImageIndex(index);
              }}
            >
              {toilet.images.map((imageUrl, index) => (
                <Image
                  key={index}
                  source={{ uri: imageUrl }}
                  style={styles.image}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
            {toilet.images.length > 1 && (
              <View style={styles.imageIndicator}>
                {toilet.images.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.indicator,
                      selectedImageIndex === index && styles.activeIndicator,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* 基本情報 */}
        <View style={styles.section}>
          <View style={styles.titleRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{toilet.title}</Text>
              <View style={styles.typeContainer}>
                <Text style={styles.typeIcon}>{selectedToiletType?.icon || '🚽'}</Text>
                <Text style={styles.typeLabel}>{selectedToiletType?.label || 'その他'}</Text>
              </View>
            </View>
            {toilet.isAccessible && (
              <View style={styles.accessibleBadge}>
                <Icon name="accessibility" size={16} color="#4CAF50" />
                <Text style={styles.accessibleText}>バリアフリー</Text>
              </View>
            )}
          </View>

          {toilet.description && <Text style={styles.description}>{toilet.description}</Text>}

          {/* 評価 */}
          <View style={styles.ratingContainer}>
            <View style={styles.ratingRow}>
              <Text style={styles.ratingLabel}>総合評価</Text>
              <View style={styles.ratingValue}>
                <Text style={styles.ratingNumber}>{toilet.rating?.toFixed(1) || 'N/A'}</Text>
                <View style={styles.stars}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <Icon
                      key={star}
                      name="star"
                      size={16}
                      color={star <= Math.round(toilet.rating || 0) ? '#FFD700' : '#E0E0E0'}
                    />
                  ))}
                </View>
                <Text style={styles.reviewCount}>({toilet.reviewCount}件)</Text>
              </View>
            </View>
          </View>

          {/* 位置情報 */}
          <View style={styles.locationContainer}>
            <Icon name="location" size={16} color="#666" />
            <Text style={styles.locationText}>
              {toilet.latitude.toFixed(6)}, {toilet.longitude.toFixed(6)}
            </Text>
          </View>
        </View>

        {/* 「役に立った」投票 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>この情報は役に立ちましたか？</Text>
          <HelpfulVoting toiletId={toilet.id} size="large" showStats={true} showText={true} />
        </View>

        {/* 設備情報 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>設備情報</Text>
          <View style={styles.facilitiesGrid}>
            {Object.entries(facilityLabels).map(([key, label]) => {
              const hasFeature = toilet.facilities?.[key as keyof typeof toilet.facilities];
              return (
                <View
                  key={key}
                  style={[
                    styles.facilityItem,
                    hasFeature ? styles.facilityAvailable : styles.facilityUnavailable,
                  ]}
                >
                  <Text style={styles.facilityIcon}>
                    {facilityIcons[key as keyof typeof facilityIcons]}
                  </Text>
                  <Text
                    style={[
                      styles.facilityLabel,
                      hasFeature ? styles.facilityLabelAvailable : styles.facilityLabelUnavailable,
                    ]}
                  >
                    {label}
                  </Text>
                  <Icon
                    name={hasFeature ? 'checkmark-circle' : 'close-circle'}
                    size={16}
                    color={hasFeature ? '#4CAF50' : '#999'}
                  />
                </View>
              );
            })}
          </View>
        </View>

        {/* 営業時間 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>営業時間</Text>
          {toilet.openingHours?.is24Hours ? (
            <Text style={styles.openingHours}>24時間利用可能</Text>
          ) : (
            <Text style={styles.openingHours}>
              {toilet.openingHours?.openTime || '不明'} - {toilet.openingHours?.closeTime || '不明'}
            </Text>
          )}
          {toilet.openingHours?.notes && (
            <Text style={styles.openingNotes}>{toilet.openingHours.notes}</Text>
          )}
        </View>

        {/* 追加情報 */}
        {toilet.additionalInfo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>追加情報</Text>
            <Text style={styles.additionalInfo}>{toilet.additionalInfo}</Text>
          </View>
        )}

        {/* アクションボタン */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              // TODO: 地図で表示
              console.log('Show on map');
            }}
          >
            <Icon name="map" size={20} color="#4285f4" />
            <Text style={styles.actionButtonText}>地図で表示</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              // TODO: 編集画面へ
              console.log('Edit toilet');
            }}
          >
            <Icon name="create" size={20} color="#4285f4" />
            <Text style={styles.actionButtonText}>情報を編集</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              // TODO: 通報機能
              console.log('Report toilet');
            }}
          >
            <Icon name="flag" size={20} color="#f44336" />
            <Text style={[styles.actionButtonText, { color: '#f44336' }]}>通報</Text>
          </TouchableOpacity>
        </View>

        {/* 投稿者情報 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>投稿情報</Text>
          <Text style={styles.createdInfo}>
            投稿日: {toilet.createdAt?.toLocaleDateString() || '不明'}
          </Text>
          {toilet.updatedAt && toilet.updatedAt !== toilet.createdAt && (
            <Text style={styles.updatedInfo}>更新日: {toilet.updatedAt.toLocaleDateString()}</Text>
          )}
        </View>

        {/* 底部スペース */}
        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backButton: {
    marginTop: 20,
    backgroundColor: '#4285f4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  content: {
    flex: 1,
  },
  imageSection: {
    position: 'relative',
  },
  image: {
    width: screenWidth,
    height: 250,
  },
  imageIndicator: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#fff',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  typeLabel: {
    fontSize: 14,
    color: '#666',
  },
  accessibleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  accessibleText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 16,
  },
  ratingContainer: {
    marginBottom: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  ratingValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  stars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  reviewCount: {
    fontSize: 14,
    color: '#666',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  facilitiesGrid: {
    gap: 8,
  },
  facilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  facilityAvailable: {
    backgroundColor: '#e8f5e8',
  },
  facilityUnavailable: {
    backgroundColor: '#f5f5f5',
  },
  facilityIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  facilityLabel: {
    flex: 1,
    fontSize: 14,
  },
  facilityLabelAvailable: {
    color: '#333',
  },
  facilityLabelUnavailable: {
    color: '#999',
  },
  openingHours: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  openingNotes: {
    fontSize: 14,
    color: '#666',
  },
  additionalInfo: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  actionSection: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#4285f4',
    marginLeft: 8,
    fontWeight: '500',
  },
  createdInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  updatedInfo: {
    fontSize: 14,
    color: '#666',
  },
  bottomSpace: {
    height: 20,
  },
});

export default ToiletDetailScreen;
