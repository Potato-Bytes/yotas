import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import DatePicker from '@react-native-community/datetimepicker';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationSettings } from '../../types/post';

const NotificationSettingsScreen: React.FC = () => {
  const { settings, isLoading, updateSettings, sendTestNotification } = useNotifications();

  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // 設定更新のヘルパー
  const handleSettingChange = useCallback(
    async (key: keyof NotificationSettings, value: boolean | string) => {
      if (!settings) return;

      try {
        await updateSettings({ [key]: value });
      } catch (error) {
        Alert.alert('エラー', '設定の更新に失敗しました');
      }
    },
    [settings, updateSettings],
  );

  // テスト通知の送信
  const handleSendTestNotification = useCallback(async () => {
    try {
      await sendTestNotification('テスト通知', 'これはテスト用の通知です。正常に動作しています！');
      Alert.alert('送信完了', 'テスト通知を送信しました');
    } catch (error) {
      Alert.alert('エラー', 'テスト通知の送信に失敗しました');
    }
  }, [sendTestNotification]);

  // 時刻選択の処理
  const handleTimeChange = useCallback(
    (type: 'start' | 'end', event: any, selectedTime?: Date) => {
      if (type === 'start') {
        setShowStartTimePicker(false);
      } else {
        setShowEndTimePicker(false);
      }

      if (selectedTime && settings) {
        const timeString = `${selectedTime.getHours().toString().padStart(2, '0')}:${selectedTime
          .getMinutes()
          .toString()
          .padStart(2, '0')}`;

        if (type === 'start') {
          handleSettingChange('quietHoursStart', timeString);
        } else {
          handleSettingChange('quietHoursEnd', timeString);
        }
      }
    },
    [settings, handleSettingChange],
  );

  // 時刻文字列をDateオブジェクトに変換
  const parseTimeString = (timeString: string): Date => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  if (isLoading || !settings) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>通知設定</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* 全体設定 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>全体設定</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>プッシュ通知</Text>
              <Text style={styles.settingDescription}>全ての通知を受け取るかどうか</Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={value => handleSettingChange('enabled', value)}
              thumbColor="#fff"
              trackColor={{ false: '#ccc', true: '#4285f4' }}
            />
          </View>
        </View>

        {/* 詳細設定 */}
        {settings.enabled && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>詳細設定</Text>

            <View style={styles.settingItem}>
              <View style={styles.settingContent}>
                <View style={styles.settingHeader}>
                  <Icon name="trophy" size={20} color="#FFD700" />
                  <Text style={styles.settingLabel}>バッジ取得通知</Text>
                </View>
                <Text style={styles.settingDescription}>新しいバッジを取得したときの通知</Text>
              </View>
              <Switch
                value={settings.badgeNotifications}
                onValueChange={value => handleSettingChange('badgeNotifications', value)}
                thumbColor="#fff"
                trackColor={{ false: '#ccc', true: '#4285f4' }}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingContent}>
                <View style={styles.settingHeader}>
                  <Icon name="thumbs-up" size={20} color="#4CAF50" />
                  <Text style={styles.settingLabel}>「役に立った」通知</Text>
                </View>
                <Text style={styles.settingDescription}>
                  投稿が「役に立った」と評価されたときの通知
                </Text>
              </View>
              <Switch
                value={settings.helpfulVoteNotifications}
                onValueChange={value => handleSettingChange('helpfulVoteNotifications', value)}
                thumbColor="#fff"
                trackColor={{ false: '#ccc', true: '#4285f4' }}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingContent}>
                <View style={styles.settingHeader}>
                  <Icon name="location" size={20} color="#FF5722" />
                  <Text style={styles.settingLabel}>近くのトイレ通知</Text>
                </View>
                <Text style={styles.settingDescription}>
                  近くに新しいトイレが追加されたときの通知
                </Text>
              </View>
              <Switch
                value={settings.nearbyToiletNotifications}
                onValueChange={value => handleSettingChange('nearbyToiletNotifications', value)}
                thumbColor="#fff"
                trackColor={{ false: '#ccc', true: '#4285f4' }}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingContent}>
                <View style={styles.settingHeader}>
                  <Icon name="refresh" size={20} color="#2196F3" />
                  <Text style={styles.settingLabel}>更新通知</Text>
                </View>
                <Text style={styles.settingDescription}>トイレ情報が更新されたときの通知</Text>
              </View>
              <Switch
                value={settings.updateNotifications}
                onValueChange={value => handleSettingChange('updateNotifications', value)}
                thumbColor="#fff"
                trackColor={{ false: '#ccc', true: '#4285f4' }}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingContent}>
                <View style={styles.settingHeader}>
                  <Icon name="newspaper" size={20} color="#9C27B0" />
                  <Text style={styles.settingLabel}>ニュース通知</Text>
                </View>
                <Text style={styles.settingDescription}>コミュニティニュースやお知らせ</Text>
              </View>
              <Switch
                value={settings.newsNotifications}
                onValueChange={value => handleSettingChange('newsNotifications', value)}
                thumbColor="#fff"
                trackColor={{ false: '#ccc', true: '#4285f4' }}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingContent}>
                <View style={styles.settingHeader}>
                  <Icon name="stats-chart" size={20} color="#FF9800" />
                  <Text style={styles.settingLabel}>週間サマリー</Text>
                </View>
                <Text style={styles.settingDescription}>週間の活動サマリー通知</Text>
              </View>
              <Switch
                value={settings.summaryNotifications}
                onValueChange={value => handleSettingChange('summaryNotifications', value)}
                thumbColor="#fff"
                trackColor={{ false: '#ccc', true: '#4285f4' }}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingContent}>
                <View style={styles.settingHeader}>
                  <Icon name="alarm" size={20} color="#607D8B" />
                  <Text style={styles.settingLabel}>リマインダー通知</Text>
                </View>
                <Text style={styles.settingDescription}>達成に近いバッジのリマインダー</Text>
              </View>
              <Switch
                value={settings.reminderNotifications}
                onValueChange={value => handleSettingChange('reminderNotifications', value)}
                thumbColor="#fff"
                trackColor={{ false: '#ccc', true: '#4285f4' }}
              />
            </View>
          </View>
        )}

        {/* サイレント時間設定 */}
        {settings.enabled && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>サイレント時間</Text>

            <View style={styles.settingItem}>
              <View style={styles.settingContent}>
                <View style={styles.settingHeader}>
                  <Icon name="moon" size={20} color="#3F51B5" />
                  <Text style={styles.settingLabel}>サイレント時間を有効にする</Text>
                </View>
                <Text style={styles.settingDescription}>指定した時間帯は通知を受け取りません</Text>
              </View>
              <Switch
                value={settings.quietHoursEnabled}
                onValueChange={value => handleSettingChange('quietHoursEnabled', value)}
                thumbColor="#fff"
                trackColor={{ false: '#ccc', true: '#4285f4' }}
              />
            </View>

            {settings.quietHoursEnabled && (
              <>
                <TouchableOpacity
                  style={styles.timeSettingItem}
                  onPress={() => setShowStartTimePicker(true)}
                >
                  <Text style={styles.timeLabel}>開始時刻</Text>
                  <Text style={styles.timeValue}>{settings.quietHoursStart}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.timeSettingItem}
                  onPress={() => setShowEndTimePicker(true)}
                >
                  <Text style={styles.timeLabel}>終了時刻</Text>
                  <Text style={styles.timeValue}>{settings.quietHoursEnd}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* テスト送信 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>テスト</Text>

          <TouchableOpacity style={styles.testButton} onPress={handleSendTestNotification}>
            <Icon name="send" size={20} color="#4285f4" />
            <Text style={styles.testButtonText}>テスト通知を送信</Text>
          </TouchableOpacity>
        </View>

        {/* 注意事項 */}
        <View style={styles.section}>
          <Text style={styles.noteTitle}>注意事項</Text>
          <Text style={styles.noteText}>
            • 通知を受け取るには、端末の通知設定でyotasアプリの通知を許可してください{'\n'}•
            バッテリー最適化の設定により、通知が遅れる場合があります{'\n'}•
            重要な通知は設定に関わらず送信される場合があります
          </Text>
        </View>
      </ScrollView>

      {/* 時刻選択モーダル */}
      {showStartTimePicker && (
        <Modal transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.timePickerContainer}>
              <DatePicker
                value={parseTimeString(settings.quietHoursStart)}
                mode="time"
                display="spinner"
                onChange={(event, selectedTime) => handleTimeChange('start', event, selectedTime)}
              />
            </View>
          </View>
        </Modal>
      )}

      {showEndTimePicker && (
        <Modal transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.timePickerContainer}>
              <DatePicker
                value={parseTimeString(settings.quietHoursEnd)}
                mode="time"
                display="spinner"
                onChange={(event, selectedTime) => handleTimeChange('end', event, selectedTime)}
              />
            </View>
          </View>
        </Modal>
      )}
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
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  settingContent: {
    flex: 1,
    marginRight: 16,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  timeSettingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginVertical: 4,
  },
  timeLabel: {
    fontSize: 16,
    color: '#333',
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4285f4',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4285f4',
    backgroundColor: '#fff',
  },
  testButtonText: {
    fontSize: 16,
    color: '#4285f4',
    fontWeight: '600',
    marginLeft: 8,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  noteText: {
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 20,
  },
});

export default NotificationSettingsScreen;
