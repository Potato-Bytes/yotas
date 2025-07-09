import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Modal,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../../navigation/AppNavigator';
import { useToiletPost } from '../../hooks/useToiletPost';
import {
  toiletTypeOptions,
  ratingCategories,
  genderTypeOptions,
} from '../../types/post';
import { ToiletType } from '../../types/maps';
import LocationPicker from '../../components/map/LocationPicker';
import ImagePickerComponent from '../../components/post/ImagePicker';
import StarRating from '../../components/common/StarRating';
import { useLocationStore } from '../../stores/locationStore';

type PostReviewScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Post'>;

const PostReviewScreen: React.FC = () => {
  const navigation = useNavigation<PostReviewScreenNavigationProp>();
  const {
    form,
    isLoading,
    errors,
    updateTitle,
    updateType,
    updateLocation,
    updateOpeningHours,
    updateAdditionalInfo,
    updateRating,
    updateDetailedEquipment,
    updateMaleEquipment,
    updateFemaleEquipment,
    updateSharedEquipment,
    addImage,
    removeImage,
    submitForm,
    resetForm,
  } = useToiletPost();

  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showEquipmentPicker, setShowEquipmentPicker] = useState<{
    type: 'urinals' | 'westernToilets' | 'japaneseToilets' | null;
    gender: 'male' | 'female' | 'shared';
  }>({ type: null, gender: 'male' });
  // Zustandストアから位置情報を取得
  const { location, errorMsg, isLoading: locationLoading } = useLocationStore();

  // 位置選択の確定
  const handleLocationConfirm = useCallback(() => {
    setShowLocationPicker(false);
  }, []);

  // タイプ選択
  const handleTypeSelect = useCallback(
    (type: ToiletType) => {
      updateType(type);
      setShowTypePicker(false);
    },
    [updateType],
  );

  // フォーム送信
  const handleSubmit = useCallback(async () => {
    const success = await submitForm();
    if (success) {
      Alert.alert('投稿完了', 'トイレ情報が正常に投稿されました！', [
        { text: 'OK', onPress: () => {
          resetForm();
          // タブナビゲーションの場合はgoBackを使用してMapタブに戻る
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate('Map');
          }
        }},
      ]);
    }
  }, [submitForm, resetForm, navigation]);

  // キャンセルボタンの処理
  const handleCancel = useCallback(() => {
    resetForm();
    // タブナビゲーションの場合はgoBackを使用してMapタブに戻る
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Map');
    }
  }, [resetForm, navigation]);

  const selectedTypeOption = toiletTypeOptions.find(option => option.value === form.type);

  // フォームの位置情報
  const [formLocation, setFormLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // 位置情報の設定
  useEffect(() => {
    console.log('PostReviewScreen: 位置情報状態', {
      hasUserLocation: !!location,
      locationLoading: locationLoading,
      hasLocationError: !!errorMsg,
      hasFormLocation: !!formLocation
    });

    // 位置情報が取得できた場合、フォームに設定
    if (location && !formLocation) {
      console.log('PostReviewScreen: 位置情報をフォームに設定');
      const newLocation = {
        latitude: location.latitude,
        longitude: location.longitude,
      };
      setFormLocation(newLocation);
      updateLocation(newLocation);
    } else if (errorMsg && !formLocation && !locationLoading) {
      // エラーの場合はデフォルト位置を設定（札幌駅）
      console.log('PostReviewScreen: エラーのためデフォルト位置を設定');
      const defaultLocation = {
        latitude: 43.06866, // 札幌駅
        longitude: 141.3507,
      };
      setFormLocation(defaultLocation);
      updateLocation(defaultLocation);
    }
  }, [location, errorMsg, locationLoading, formLocation, updateLocation]);

  return (
    <SafeAreaView style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Icon name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>トイレを投稿</Text>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isLoading}
          style={[styles.submitButton, isLoading && styles.disabledButton]}
        >
          <Text style={styles.submitButtonText}>{isLoading ? '投稿中...' : '投稿'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* エラー表示 */}
        {errors.length > 0 && (
          <View style={styles.errorContainer}>
            {errors.map((error, index) => (
              <Text key={index} style={styles.errorText}>
                • {error}
              </Text>
            ))}
          </View>
        )}

        {/* 基本情報 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本情報</Text>

          {/* トイレの場所 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>トイレの場所 *</Text>
            <TextInput
              style={styles.textInput}
              value={form.toilets[0]?.title || ''}
              onChangeText={updateTitle}
              placeholder="例: 東京駅丸の内口トイレ"
              maxLength={50}
            />
            <Text style={styles.charCount}>{form.toilets[0]?.title.length || 0}/50</Text>
          </View>

          {/* トイレタイプ */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>トイレタイプ *</Text>
            <TouchableOpacity style={styles.picker} onPress={() => setShowTypePicker(true)}>
              <Text style={styles.pickerText}>
                {selectedTypeOption
                  ? `${selectedTypeOption.icon} ${selectedTypeOption.label}`
                  : 'タイプを選択'}
              </Text>
              <Icon name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* 位置情報 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>位置情報 *</Text>
            <TouchableOpacity style={styles.picker} onPress={() => setShowLocationPicker(true)}>
              <Text style={styles.pickerText}>
                {form.location
                  ? `📍 ${form.location.latitude.toFixed(6)}, ${form.location.longitude.toFixed(6)}`
                  : locationLoading
                  ? '📍 位置情報取得中...'
                  : '位置を選択してください'}
              </Text>
              <Icon name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* 位置情報表示部分 */}
          <View style={styles.locationContainer}>
            {locationLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" />
                <Text style={styles.loadingText}>位置情報を取得中...</Text>
              </View>
            ) : formLocation ? (
              <Text style={styles.locationText}>
                📍 位置: {formLocation.latitude.toFixed(6)}, {formLocation.longitude.toFixed(6)}
              </Text>
            ) : (
              <Text style={styles.locationErrorText}>
                📍 位置情報なし
              </Text>
            )}
          </View>

        </View>

        {/* 詳細設備情報 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>詳細設備情報</Text>

          {/* 男女区分 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>男女区分</Text>
            <View style={styles.genderTypeContainer}>
              {genderTypeOptions.filter(option => option.value !== 'multipurpose').map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.genderTypeOption,
                    form.toilets[0]?.detailedEquipment.genderType === option.value && styles.selectedGenderType,
                  ]}
                  onPress={() =>
                    updateDetailedEquipment({
                      genderType: option.value as 'separate' | 'shared' | 'multipurpose',
                      maleEquipment:
                        option.value === 'separate' ? { urinals: 0, westernToilets: 0 } : null,
                      femaleEquipment:
                        option.value === 'separate'
                          ? { japaneseToilets: 0, westernToilets: 0 }
                          : null,
                      sharedEquipment:
                        option.value === 'shared'
                          ? { japaneseToilets: 0, westernToilets: 0 }
                          : null,
                    })
                  }
                >
                  <Text style={styles.genderTypeIcon}>{option.icon}</Text>
                  <Text style={styles.genderTypeLabel}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 男性用設備（男女別の場合） */}
          {form.toilets[0]?.detailedEquipment.genderType === 'separate' && (
            <View style={styles.equipmentSection}>
              <Text style={styles.equipmentTitle}>🚹 男性用設備</Text>
              <View style={styles.equipmentRow}>
                <View style={styles.equipmentItem}>
                  <Text style={styles.equipmentLabel}>小便器</Text>
                  <TouchableOpacity 
                    style={styles.countPicker}
                    onPress={() => {
                      setShowEquipmentPicker({ type: 'urinals', gender: 'male' });
                    }}
                  >
                    <Text style={styles.countText}>
                      {form.toilets[0]?.detailedEquipment.maleEquipment?.urinals === 10 
                        ? '10台以上' 
                        : `${form.toilets[0]?.detailedEquipment.maleEquipment?.urinals || 0}台`
                      }
                    </Text>
                    <Icon name="chevron-down" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
                <View style={styles.equipmentItem}>
                  <Text style={styles.equipmentLabel}>洋式便器</Text>
                  <TouchableOpacity 
                    style={styles.countPicker}
                    onPress={() => {
                      setShowEquipmentPicker({ type: 'westernToilets', gender: 'male' });
                    }}
                  >
                    <Text style={styles.countText}>
                      {form.toilets[0]?.detailedEquipment.maleEquipment?.westernToilets === 10 
                        ? '10台以上' 
                        : `${form.toilets[0]?.detailedEquipment.maleEquipment?.westernToilets || 0}台`
                      }
                    </Text>
                    <Icon name="chevron-down" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* 女性用設備（男女別の場合） */}
          {form.toilets[0]?.detailedEquipment.genderType === 'separate' && (
            <View style={styles.equipmentSection}>
              <Text style={styles.equipmentTitle}>🚺 女性用設備</Text>
              <View style={styles.equipmentRow}>
                <View style={styles.equipmentItem}>
                  <Text style={styles.equipmentLabel}>和式便器</Text>
                  <TouchableOpacity 
                    style={styles.countPicker}
                    onPress={() => {
                      setShowEquipmentPicker({ type: 'japaneseToilets', gender: 'female' });
                    }}
                  >
                    <Text style={styles.countText}>
                      {form.toilets[0]?.detailedEquipment.femaleEquipment?.japaneseToilets === 10 
                        ? '10台以上' 
                        : `${form.toilets[0]?.detailedEquipment.femaleEquipment?.japaneseToilets || 0}台`
                      }
                    </Text>
                    <Icon name="chevron-down" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
                <View style={styles.equipmentItem}>
                  <Text style={styles.equipmentLabel}>洋式便器</Text>
                  <TouchableOpacity 
                    style={styles.countPicker}
                    onPress={() => {
                      setShowEquipmentPicker({ type: 'westernToilets', gender: 'female' });
                    }}
                  >
                    <Text style={styles.countText}>
                      {form.toilets[0]?.detailedEquipment.femaleEquipment?.westernToilets === 10 
                        ? '10台以上' 
                        : `${form.toilets[0]?.detailedEquipment.femaleEquipment?.westernToilets || 0}台`
                      }
                    </Text>
                    <Icon name="chevron-down" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* 共用設備（共用の場合） */}
          {form.toilets[0]?.detailedEquipment.genderType === 'shared' && (
            <View style={styles.equipmentSection}>
              <Text style={styles.equipmentTitle}>🚽 共用設備</Text>
              <View style={styles.equipmentRow}>
                <View style={styles.equipmentItem}>
                  <Text style={styles.equipmentLabel}>和式便器</Text>
                  <TouchableOpacity 
                    style={styles.countPicker}
                    onPress={() => {
                      setShowEquipmentPicker({ type: 'japaneseToilets', gender: 'shared' });
                    }}
                  >
                    <Text style={styles.countText}>
                      {form.toilets[0]?.detailedEquipment.sharedEquipment?.japaneseToilets === 10 
                        ? '10台以上' 
                        : `${form.toilets[0]?.detailedEquipment.sharedEquipment?.japaneseToilets || 0}台`
                      }
                    </Text>
                    <Icon name="chevron-down" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
                <View style={styles.equipmentItem}>
                  <Text style={styles.equipmentLabel}>洋式便器</Text>
                  <TouchableOpacity 
                    style={styles.countPicker}
                    onPress={() => {
                      setShowEquipmentPicker({ type: 'westernToilets', gender: 'shared' });
                    }}
                  >
                    <Text style={styles.countText}>
                      {form.toilets[0]?.detailedEquipment.sharedEquipment?.westernToilets === 10 
                        ? '10台以上' 
                        : `${form.toilets[0]?.detailedEquipment.sharedEquipment?.westernToilets || 0}台`
                      }
                    </Text>
                    <Icon name="chevron-down" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* 付帯設備 */}
          <View style={styles.additionalFacilities}>
            <Text style={styles.equipmentTitle}>🏢 付帯設備</Text>
            
            <View style={styles.facilitySwitch}>
              <Text style={styles.facilitySwitchLabel}>♿ 多目的トイレ</Text>
              <Switch
                value={form.toilets[0]?.detailedEquipment.additionalFeatures.hasWheelchairAccess || false}
                onValueChange={value =>
                  updateDetailedEquipment({
                    ...form.toilets[0]?.detailedEquipment,
                    additionalFeatures: {
                      ...form.toilets[0]?.detailedEquipment.additionalFeatures,
                      hasWheelchairAccess: value,
                    },
                  })
                }
                thumbColor="#fff"
                trackColor={{ false: '#ccc', true: '#4285f4' }}
              />
            </View>

            <View style={styles.facilitySwitch}>
              <Text style={styles.facilitySwitchLabel}>👶 ベビーシート</Text>
              <Switch
                value={form.toilets[0]?.detailedEquipment.additionalFeatures.hasBabyChangingTable || false}
                onValueChange={value =>
                  updateDetailedEquipment({
                    ...form.toilets[0]?.detailedEquipment,
                    additionalFeatures: {
                      ...form.toilets[0]?.detailedEquipment.additionalFeatures,
                      hasBabyChangingTable: value,
                    },
                  })
                }
                thumbColor="#fff"
                trackColor={{ false: '#ccc', true: '#4285f4' }}
              />
            </View>

            <View style={styles.facilitySwitch}>
              <Text style={styles.facilitySwitchLabel}>🚿 温水洗浄便座</Text>
              <Switch
                value={form.toilets[0]?.detailedEquipment.additionalFeatures.hasWashlet || false}
                onValueChange={value =>
                  updateDetailedEquipment({
                    ...form.toilets[0]?.detailedEquipment,
                    additionalFeatures: {
                      ...form.toilets[0]?.detailedEquipment.additionalFeatures,
                      hasWashlet: value,
                    },
                  })
                }
                thumbColor="#fff"
                trackColor={{ false: '#ccc', true: '#4285f4' }}
              />
            </View>
          </View>

        </View>

        {/* 営業時間 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>営業時間</Text>

          <View style={styles.switchGroup}>
            <Text style={styles.switchLabel}>24時間利用可能</Text>
            <Switch
              value={form.openingHours.is24Hours}
              onValueChange={value => updateOpeningHours({ is24Hours: value })}
              thumbColor="#fff"
              trackColor={{ false: '#ccc', true: '#4285f4' }}
            />
          </View>

          {!form.openingHours.is24Hours && (
            <View style={styles.timeInputs}>
              <View style={styles.timeInput}>
                <Text style={styles.label}>開始時間</Text>
                <TextInput
                  style={styles.textInput}
                  value={form.openingHours.openTime || ''}
                  onChangeText={time => updateOpeningHours({ openTime: time })}
                  placeholder="09:00"
                />
              </View>
              <View style={styles.timeInput}>
                <Text style={styles.label}>終了時間</Text>
                <TextInput
                  style={styles.textInput}
                  value={form.openingHours.closeTime || ''}
                  onChangeText={time => updateOpeningHours({ closeTime: time })}
                  placeholder="21:00"
                />
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>営業時間の備考</Text>
            <TextInput
              style={styles.textInput}
              value={form.openingHours.notes || ''}
              onChangeText={notes => updateOpeningHours({ notes })}
              placeholder="例: 年末年始は休業"
            />
          </View>
        </View>

        {/* 評価軸 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>評価</Text>
          {ratingCategories.map(category => (
            <StarRating
              key={category.key}
              rating={form.toilets[0]?.ratings[category.key] || 0}
              onRatingChange={rating => updateRating(category.key, rating)}
              label={`${category.icon} ${category.label}`}
              description={category.description}
              required={category.required}
              showValue={true}
            />
          ))}
        </View>

        {/* 写真 */}
        <View style={styles.section}>
          <ImagePickerComponent
            images={form.toilets[0]?.images || []}
            onAddImage={addImage}
            onRemoveImage={removeImage}
            maxImages={5}
          />
        </View>

        {/* 追加情報 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>追加情報</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={form.additionalInfo}
            onChangeText={updateAdditionalInfo}
            placeholder="その他気付いた点や注意事項があれば..."
            multiline
            numberOfLines={3}
            maxLength={300}
          />
          <Text style={styles.charCount}>{form.additionalInfo.length}/300</Text>
        </View>

        {/* 底部スペース */}
        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* 位置選択モーダル */}
      <Modal visible={showLocationPicker} animationType="slide" presentationStyle="fullScreen">
        <LocationPicker
          selectedLocation={form.location}
          onLocationSelect={updateLocation}
          onCancel={() => setShowLocationPicker(false)}
          onConfirm={handleLocationConfirm}
        />
      </Modal>

      {/* タイプ選択モーダル */}
      <Modal visible={showTypePicker} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.typePickerModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>トイレタイプを選択</Text>
              <TouchableOpacity onPress={() => setShowTypePicker(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {toiletTypeOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.typeOption,
                    form.type === option.value && styles.selectedTypeOption,
                  ]}
                  onPress={() => handleTypeSelect(option.value)}
                >
                  <Text style={styles.typeIcon}>{option.icon}</Text>
                  <Text style={styles.typeLabel}>{option.label}</Text>
                  {form.type === option.value && (
                    <Icon name="checkmark-circle" size={24} color="#4285f4" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 設備数選択モーダル */}
      <Modal visible={showEquipmentPicker.type !== null} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.equipmentPickerModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {showEquipmentPicker.type === 'urinals' && '小便器数を選択'}
                {showEquipmentPicker.type === 'westernToilets' && '洋式便器数を選択'}
                {showEquipmentPicker.type === 'japaneseToilets' && '和式便器数を選択'}
              </Text>
              <TouchableOpacity onPress={() => setShowEquipmentPicker({ type: null, gender: 'male' })}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <TouchableOpacity
                  key={num}
                  style={styles.equipmentOption}
                  onPress={() => {
                    if (showEquipmentPicker.gender === 'male') {
                      updateMaleEquipment({ [showEquipmentPicker.type!]: num });
                    } else if (showEquipmentPicker.gender === 'female') {
                      updateFemaleEquipment({ [showEquipmentPicker.type!]: num });
                    } else {
                      updateSharedEquipment({ [showEquipmentPicker.type!]: num });
                    }
                    setShowEquipmentPicker({ type: null, gender: 'male' });
                  }}
                >
                  <Text style={styles.equipmentOptionText}>
                    {num === 10 ? '10台以上' : `${num}台`}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#4285f4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginVertical: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    marginBottom: 4,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  pickerText: {
    fontSize: 16,
    color: '#333',
  },
  switchGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  switchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  switchIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  timeInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  timeInput: {
    flex: 0.48,
  },
  bottomSpace: {
    height: 50,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  typePickerModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedTypeOption: {
    backgroundColor: '#e3f2fd',
  },
  typeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  typeLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  genderTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderTypeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  selectedGenderType: {
    backgroundColor: '#e3f2fd',
    borderColor: '#4285f4',
  },
  genderTypeIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  genderTypeLabel: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  equipmentSection: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  equipmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  equipmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  equipmentItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  equipmentLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  numberInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#fff',
    textAlign: 'center',
    minWidth: 60,
  },
  equipmentUnit: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  countPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    minWidth: 80,
  },
  countText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    flex: 1,
  },
  additionalFacilities: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  facilitySwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  facilitySwitchLabel: {
    fontSize: 16,
    color: '#333',
  },
  equipmentPickerModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  equipmentOption: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  equipmentOptionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  locationContainer: {
    backgroundColor: 'white',
    padding: 12,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  locationText: {
    fontSize: 14,
    color: '#333',
  },
  locationErrorText: {
    fontSize: 14,
    color: '#999',
  },
});

export default PostReviewScreen;
