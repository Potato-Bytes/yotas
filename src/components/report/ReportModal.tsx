import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { ReportTargetType, ReportReason } from '../../types/post';
import { useReport } from '../../hooks/useReport';

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  targetTitle?: string;
}

const ReportModal: React.FC<ReportModalProps> = ({
  visible,
  onClose,
  targetType,
  targetId,
  targetTitle,
}) => {
  const { submitReport, isSubmitting, getReasonDisplayName } = useReport();
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [step, setStep] = useState<'reason' | 'details' | 'confirmation'>('reason');

  const reasonOptions = [
    {
      reason: ReportReason.INAPPROPRIATE_CONTENT,
      icon: '⚠️',
      description: '不適切な画像やテキストが含まれている',
    },
    {
      reason: ReportReason.SPAM,
      icon: '📧',
      description: '関係のない内容やスパム投稿',
    },
    {
      reason: ReportReason.HARASSMENT,
      icon: '😤',
      description: '嫌がらせや攻撃的な内容',
    },
    {
      reason: ReportReason.FAKE_INFORMATION,
      icon: '❌',
      description: '虚偽の情報や誤解を招く内容',
    },
    {
      reason: ReportReason.PRIVACY_VIOLATION,
      icon: '🔒',
      description: '個人情報の無断掲載',
    },
    {
      reason: ReportReason.COPYRIGHT_VIOLATION,
      icon: '©️',
      description: '著作権を侵害する内容',
    },
    {
      reason: ReportReason.COMMERCIAL_SPAM,
      icon: '💰',
      description: '広告や宣伝目的の投稿',
    },
    {
      reason: ReportReason.HATE_SPEECH,
      icon: '💢',
      description: '差別的な発言やヘイトスピーチ',
    },
    {
      reason: ReportReason.OTHER,
      icon: '🤔',
      description: 'その他の問題',
    },
  ];

  const handleClose = () => {
    setSelectedReason(null);
    setDescription('');
    setStep('reason');
    onClose();
  };

  const handleReasonSelect = (reason: ReportReason) => {
    setSelectedReason(reason);
    setStep('details');
  };

  const handleBack = () => {
    if (step === 'details') {
      setStep('reason');
    } else if (step === 'confirmation') {
      setStep('details');
    }
  };

  const handleSubmit = async () => {
    if (!selectedReason) return;

    if (step === 'details') {
      setStep('confirmation');
      return;
    }

    const success = await submitReport(
      targetType,
      targetId,
      selectedReason,
      description.trim() || undefined,
    );

    if (success) {
      handleClose();
    }
  };

  const getTargetTypeDisplayName = (type: ReportTargetType): string => {
    const names = {
      [ReportTargetType.TOILET]: 'トイレ投稿',
      [ReportTargetType.REVIEW]: 'レビュー',
      [ReportTargetType.USER]: 'ユーザー',
      [ReportTargetType.COMMENT]: 'コメント',
    };
    return names[type] || type;
  };

  const renderReasonSelection = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>通報理由を選択してください</Text>
      <Text style={styles.sectionDescription}>
        {getTargetTypeDisplayName(targetType)}に問題がある理由を選択してください
      </Text>

      <View style={styles.reasonList}>
        {reasonOptions.map(option => (
          <TouchableOpacity
            key={option.reason}
            style={[
              styles.reasonOption,
              selectedReason === option.reason && styles.selectedReasonOption,
            ]}
            onPress={() => handleReasonSelect(option.reason)}
            activeOpacity={0.7}
          >
            <Text style={styles.reasonIcon}>{option.icon}</Text>
            <View style={styles.reasonContent}>
              <Text style={styles.reasonTitle}>{getReasonDisplayName(option.reason)}</Text>
              <Text style={styles.reasonDescription}>{option.description}</Text>
            </View>
            <Icon name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderDetailsInput = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>詳細情報（任意）</Text>
      <Text style={styles.sectionDescription}>
        問題の詳細について教えてください。より迅速な対応が可能になります。
      </Text>

      <View style={styles.selectedReasonDisplay}>
        <Text style={styles.selectedReasonLabel}>選択した理由:</Text>
        <Text style={styles.selectedReasonText}>
          {selectedReason && getReasonDisplayName(selectedReason)}
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>詳細説明</Text>
        <TextInput
          style={styles.textInput}
          placeholder="問題の詳細を入力してください（任意）"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          maxLength={500}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{description.length}/500</Text>
      </View>
    </ScrollView>
  );

  const renderConfirmation = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>通報内容の確認</Text>
      <Text style={styles.sectionDescription}>
        以下の内容で通報を送信します。内容を確認してください。
      </Text>

      <View style={styles.confirmationCard}>
        <View style={styles.confirmationItem}>
          <Text style={styles.confirmationLabel}>対象:</Text>
          <Text style={styles.confirmationValue}>
            {getTargetTypeDisplayName(targetType)}
            {targetTitle && ` - ${targetTitle}`}
          </Text>
        </View>

        <View style={styles.confirmationItem}>
          <Text style={styles.confirmationLabel}>理由:</Text>
          <Text style={styles.confirmationValue}>
            {selectedReason && getReasonDisplayName(selectedReason)}
          </Text>
        </View>

        {description && (
          <View style={styles.confirmationItem}>
            <Text style={styles.confirmationLabel}>詳細:</Text>
            <Text style={styles.confirmationValue}>{description}</Text>
          </View>
        )}
      </View>

      <View style={styles.warningCard}>
        <Icon name="information-circle" size={20} color="#FF9800" />
        <Text style={styles.warningText}>
          虚偽の通報や悪用は利用制限の対象となる場合があります。
        </Text>
      </View>
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <TouchableOpacity onPress={step === 'reason' ? handleClose : handleBack}>
            <Icon name={step === 'reason' ? 'close' : 'chevron-back'} size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>通報</Text>
          <View style={styles.placeholder} />
        </View>

        {/* ステップインジケーター */}
        <View style={styles.stepIndicator}>
          <View style={styles.stepContainer}>
            <View
              style={[
                styles.stepDot,
                (step === 'reason' || step === 'details' || step === 'confirmation') &&
                  styles.activeStepDot,
              ]}
            />
            <Text style={styles.stepLabel}>理由</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={styles.stepContainer}>
            <View
              style={[
                styles.stepDot,
                (step === 'details' || step === 'confirmation') && styles.activeStepDot,
              ]}
            />
            <Text style={styles.stepLabel}>詳細</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={styles.stepContainer}>
            <View style={[styles.stepDot, step === 'confirmation' && styles.activeStepDot]} />
            <Text style={styles.stepLabel}>確認</Text>
          </View>
        </View>

        {/* コンテンツ */}
        {step === 'reason' && renderReasonSelection()}
        {step === 'details' && renderDetailsInput()}
        {step === 'confirmation' && renderConfirmation()}

        {/* フッター */}
        {(step === 'details' || step === 'confirmation') && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitButton, !selectedReason && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={!selectedReason || isSubmitting}
            >
              <Text style={[styles.submitButtonText, !selectedReason && styles.disabledButtonText]}>
                {isSubmitting ? '送信中...' : step === 'confirmation' ? '通報を送信' : '次へ'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 24,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
  },
  stepContainer: {
    alignItems: 'center',
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginBottom: 4,
  },
  activeStepDot: {
    backgroundColor: '#4285f4',
  },
  stepLabel: {
    fontSize: 12,
    color: '#666',
  },
  stepLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 24,
  },
  reasonList: {
    gap: 12,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  selectedReasonOption: {
    borderColor: '#4285f4',
    backgroundColor: '#f0f8ff',
  },
  reasonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  reasonContent: {
    flex: 1,
  },
  reasonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  reasonDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  selectedReasonDisplay: {
    padding: 16,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    marginBottom: 24,
  },
  selectedReasonLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  selectedReasonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4285f4',
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    backgroundColor: '#fff',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  confirmationCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  confirmationItem: {
    marginBottom: 12,
  },
  confirmationLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  confirmationValue: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#856404',
    marginLeft: 8,
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  submitButton: {
    backgroundColor: '#4285f4',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#e0e0e0',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  disabledButtonText: {
    color: '#999',
  },
});

export default ReportModal;
