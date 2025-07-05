import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useToiletPost } from '../../hooks/useToiletPost';
import {
  toiletTypeOptions,
  facilityLabels,
  facilityIcons,
  ratingCategories,
  genderTypeOptions,
} from '../../types/post';
import { ToiletType } from '../../types/maps';
import LocationPicker from '../../components/map/LocationPicker';
import ImagePickerComponent from '../../components/post/ImagePicker';
import StarRating from '../../components/common/StarRating';

const PostReviewScreen: React.FC = () => {
  const {
    form,
    isLoading,
    errors,
    updateTitle,
    updateDescription,
    updateType,
    updateAccessibility,
    updateLocation,
    updateFacility,
    updateOpeningHours,
    updateAdditionalInfo,
    updateRating,
    updateDetailedEquipment,
    updateMaleEquipment,
    updateFemaleEquipment,
    updateSharedEquipment,
    updateAdditionalFeatures,
    addImage,
    removeImage,
    submitForm,
    resetForm,
  } = useToiletPost();

  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);

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
        { text: 'OK', onPress: resetForm },
      ]);
    }
  }, [submitForm, resetForm]);

  const selectedTypeOption = toiletTypeOptions.find(option => option.value === form.type);

  return (
    <SafeAreaView style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity onPress={resetForm}>
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

          {/* タイトル */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>タイトル *</Text>
            <TextInput
              style={styles.textInput}
              value={form.title}
              onChangeText={updateTitle}
              placeholder="例: 東京駅丸の内口トイレ"
              maxLength={50}
            />
            <Text style={styles.charCount}>{form.title.length}/50</Text>
          </View>

          {/* 説明 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>説明</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={form.description}
              onChangeText={updateDescription}
              placeholder="トイレの特徴や注意点など..."
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={styles.charCount}>{form.description.length}/500</Text>
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
                  ? `📍 ${form.location.latitude.toFixed(4)}, ${form.location.longitude.toFixed(4)}`
                  : '位置を選択してください'}
              </Text>
              <Icon name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* アクセシビリティ */}
          <View style={styles.switchGroup}>
            <View style={styles.switchContent}>
              <Icon name="accessibility" size={20} color="#4CAF50" style={styles.switchIcon} />
              <Text style={styles.switchLabel}>バリアフリー対応</Text>
            </View>
            <Switch
              value={form.isAccessible}
              onValueChange={updateAccessibility}
              thumbColor="#fff"
              trackColor={{ false: '#ccc', true: '#4CAF50' }}
            />
          </View>
        </View>

        {/* 設備情報 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>設備情報</Text>
          {Object.entries(facilityLabels).map(([key, label]) => (
            <View key={key} style={styles.switchGroup}>
              <View style={styles.switchContent}>
                <Text style={styles.switchIcon}>
                  {facilityIcons[key as keyof typeof facilityIcons]}
                </Text>
                <Text style={styles.switchLabel}>{label}</Text>
              </View>
              <Switch
                value={form.facilities[key as keyof typeof form.facilities]}
                onValueChange={value => updateFacility(key as keyof typeof form.facilities, value)}
                thumbColor="#fff"
                trackColor={{ false: '#ccc', true: '#4285f4' }}
              />
            </View>
          ))}
        </View>

        {/* 詳細設備情報 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>詳細設備情報</Text>

          {/* 男女区分 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>男女区分</Text>
            <View style={styles.genderTypeContainer}>
              {genderTypeOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.genderTypeOption,
                    form.detailedEquipment.genderType === option.value && styles.selectedGenderType,
                  ]}
                  onPress={() =>
                    updateDetailedEquipment({
                      genderType: option.value,
                      maleEquipment:
                        option.value === 'separate' ? { urinals: 0, westernToilets: 0 } : null,
                      femaleEquipment:
                        option.value === 'separate'
                          ? { japaneseToilets: 0, westernToilets: 0 }
                          : null,
                      sharedEquipment:
                        option.value !== 'separate'
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
          {form.detailedEquipment.genderType === 'separate' && (
            <View style={styles.equipmentSection}>
              <Text style={styles.equipmentTitle}>🚹 男性用設備</Text>
              <View style={styles.equipmentRow}>
                <View style={styles.equipmentItem}>
                  <Text style={styles.equipmentLabel}>小便器</Text>
                  <TextInput
                    style={styles.numberInput}
                    value={form.detailedEquipment.maleEquipment?.urinals?.toString() || '0'}
                    onChangeText={text => updateMaleEquipment({ urinals: parseInt(text) || 0 })}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                  <Text style={styles.equipmentUnit}>台</Text>
                </View>
                <View style={styles.equipmentItem}>
                  <Text style={styles.equipmentLabel}>洋式便器</Text>
                  <TextInput
                    style={styles.numberInput}
                    value={form.detailedEquipment.maleEquipment?.westernToilets?.toString() || '0'}
                    onChangeText={text =>
                      updateMaleEquipment({ westernToilets: parseInt(text) || 0 })
                    }
                    keyboardType="numeric"
                    placeholder="0"
                  />
                  <Text style={styles.equipmentUnit}>台</Text>
                </View>
              </View>
            </View>
          )}

          {/* 女性用設備（男女別の場合） */}
          {form.detailedEquipment.genderType === 'separate' && (
            <View style={styles.equipmentSection}>
              <Text style={styles.equipmentTitle}>🚺 女性用設備</Text>
              <View style={styles.equipmentRow}>
                <View style={styles.equipmentItem}>
                  <Text style={styles.equipmentLabel}>和式便器</Text>
                  <TextInput
                    style={styles.numberInput}
                    value={
                      form.detailedEquipment.femaleEquipment?.japaneseToilets?.toString() || '0'
                    }
                    onChangeText={text =>
                      updateFemaleEquipment({ japaneseToilets: parseInt(text) || 0 })
                    }
                    keyboardType="numeric"
                    placeholder="0"
                  />
                  <Text style={styles.equipmentUnit}>台</Text>
                </View>
                <View style={styles.equipmentItem}>
                  <Text style={styles.equipmentLabel}>洋式便器</Text>
                  <TextInput
                    style={styles.numberInput}
                    value={
                      form.detailedEquipment.femaleEquipment?.westernToilets?.toString() || '0'
                    }
                    onChangeText={text =>
                      updateFemaleEquipment({ westernToilets: parseInt(text) || 0 })
                    }
                    keyboardType="numeric"
                    placeholder="0"
                  />
                  <Text style={styles.equipmentUnit}>台</Text>
                </View>
              </View>
            </View>
          )}

          {/* 共用設備（共用・多目的の場合） */}
          {form.detailedEquipment.genderType !== 'separate' && (
            <View style={styles.equipmentSection}>
              <Text style={styles.equipmentTitle}>
                {form.detailedEquipment.genderType === 'shared' ? '🚽 共用設備' : '♿ 多目的設備'}
              </Text>
              <View style={styles.equipmentRow}>
                <View style={styles.equipmentItem}>
                  <Text style={styles.equipmentLabel}>和式便器</Text>
                  <TextInput
                    style={styles.numberInput}
                    value={
                      form.detailedEquipment.sharedEquipment?.japaneseToilets?.toString() || '0'
                    }
                    onChangeText={text =>
                      updateSharedEquipment({ japaneseToilets: parseInt(text) || 0 })
                    }
                    keyboardType="numeric"
                    placeholder="0"
                  />
                  <Text style={styles.equipmentUnit}>台</Text>
                </View>
                <View style={styles.equipmentItem}>
                  <Text style={styles.equipmentLabel}>洋式便器</Text>
                  <TextInput
                    style={styles.numberInput}
                    value={
                      form.detailedEquipment.sharedEquipment?.westernToilets?.toString() || '0'
                    }
                    onChangeText={text =>
                      updateSharedEquipment({ westernToilets: parseInt(text) || 0 })
                    }
                    keyboardType="numeric"
                    placeholder="0"
                  />
                  <Text style={styles.equipmentUnit}>台</Text>
                </View>
              </View>
            </View>
          )}

          {/* 追加設備 */}
          <View style={styles.equipmentSection}>
            <Text style={styles.equipmentTitle}>🔧 追加設備</Text>
            {Object.entries({
              hasBabyChangingTable: 'おむつ替え台',
              hasHandDryer: 'ハンドドライヤー',
              hasWashlet: 'ウォシュレット',
              hasPaperTowels: 'ペーパータオル',
              hasHandSoap: 'ハンドソープ',
              hasVendingMachine: '自動販売機',
              hasWheelchairAccess: '車椅子対応',
            }).map(([key, label]) => (
              <View key={key} style={styles.switchGroup}>
                <Text style={styles.switchLabel}>{label}</Text>
                <Switch
                  value={
                    form.detailedEquipment.additionalFeatures[
                      key as keyof typeof form.detailedEquipment.additionalFeatures
                    ]
                  }
                  onValueChange={value =>
                    updateAdditionalFeatures(
                      key as keyof typeof form.detailedEquipment.additionalFeatures,
                      value,
                    )
                  }
                  thumbColor="#fff"
                  trackColor={{ false: '#ccc', true: '#4285f4' }}
                />
              </View>
            ))}
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
              rating={form.ratings[category.key] || 0}
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
            images={form.images}
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
});

export default PostReviewScreen;
