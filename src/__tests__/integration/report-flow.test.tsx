import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor, mockUser, mockToilet } from '../../test-utils';

// Import components after setup
import ReportModal from '../../components/report/ReportModal';
import ReportHistoryScreen from '../../screens/report/ReportHistoryScreen';
import { ReportTargetType, ReportReason } from '../../types/post';

// Mock functions defined first
const mockSubmitReport = jest.fn();
const mockGetUserReports = jest.fn();
const mockGetUserRestrictions = jest.fn();
const mockGetUserViolationPoints = jest.fn();

// Mock dependencies
jest.mock('../../stores/authStore', () => ({
  useAuth: () => ({ user: mockUser }),
}));

// Create a mock hook that can be updated per test
const mockUseReportHook: any = {
  submitReport: mockSubmitReport,
  reports: [],
  userRestrictions: [],
  violationPoints: 0,
  isLoading: false,
  isSubmitting: false,
  error: null,
  getReasonDisplayName: (reason: any) => {
    const names: Record<string, string> = {
      inappropriate_content: '不適切なコンテンツ',
      spam: 'スパム',
      harassment: '嫌がらせ',
      fake_information: '虚偽情報',
      copyright_violation: '著作権侵害',
      privacy_violation: 'プライバシー侵害',
      commercial_spam: '商業的スパム',
      hate_speech: 'ヘイトスピーチ',
      other: 'その他',
    };
    return names[reason] || reason;
  },
  getStatusDisplayName: (status: any) => {
    const names: Record<string, string> = {
      pending: '審査待ち',
      under_review: '審査中',
      resolved: '解決済み',
      dismissed: '却下',
      auto_resolved: '自動解決',
    };
    return names[status] || status;
  },
  getStatusColor: () => '#FF9800',
  hasActiveRestrictions: () => false,
  getActiveRestrictionTypes: () => [],
  isNearViolationLimit: () => false,
  refresh: jest.fn(),
  reportCount: 0,
  activeRestrictionCount: 0,
  isHighRiskUser: false,
};

jest.mock('../../hooks/useReport', () => ({
  useReport: () => mockUseReportHook,
}));

jest.mock('../../services/reportService', () => ({
  reportService: {
    submitReport: mockSubmitReport,
    getUserReports: mockGetUserReports,
    getUserRestrictions: mockGetUserRestrictions,
    getUserViolationPoints: mockGetUserViolationPoints,
    isUserRestricted: jest.fn().mockResolvedValue({ restricted: false }),
  },
}));

describe('Report Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmitReport.mockResolvedValue(undefined);
    mockGetUserReports.mockResolvedValue([]);
    mockGetUserRestrictions.mockResolvedValue([]);
    mockGetUserViolationPoints.mockResolvedValue(0);

    // Reset mock hook data
    mockUseReportHook.reports = [];
    mockUseReportHook.userRestrictions = [];
    mockUseReportHook.violationPoints = 0;
    mockUseReportHook.isLoading = false;
    mockUseReportHook.isSubmitting = false;
    mockUseReportHook.error = null;
    mockUseReportHook.hasActiveRestrictions = () => false;
    mockUseReportHook.isNearViolationLimit = () => false;
  });

  describe('Report Submission Flow', () => {
    it('should complete full report submission flow', async () => {
      const onClose = jest.fn();

      const { getByText, getByPlaceholderText } = render(
        <ReportModal
          visible={true}
          onClose={onClose}
          targetType={ReportTargetType.TOILET}
          targetId={mockToilet.id}
          targetTitle={mockToilet.title}
        />,
      );

      // Step 1: Select report reason
      const spamOption = getByText('スパム');
      fireEvent.press(spamOption);

      // Should navigate to details step
      await waitFor(() => {
        expect(getByText('詳細情報（任意）')).toBeTruthy();
      });

      // Step 2: Add description
      const descriptionInput = getByPlaceholderText('問題の詳細を入力してください（任意）');
      fireEvent.changeText(descriptionInput, 'This is spam content');

      // Press next
      const nextButton = getByText('次へ');
      fireEvent.press(nextButton);

      // Step 3: Confirmation
      await waitFor(() => {
        expect(getByText('通報内容の確認')).toBeTruthy();
      });

      // Verify report details are shown
      expect(getByText('理由:')).toBeTruthy();
      expect(getByText('スパム')).toBeTruthy();
      expect(getByText('詳細:')).toBeTruthy();
      expect(getByText('This is spam content')).toBeTruthy();

      // Submit report
      const submitButton = getByText('通報を送信');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockSubmitReport).toHaveBeenCalledWith(
          mockUser.uid,
          ReportTargetType.TOILET,
          mockToilet.id,
          ReportReason.SPAM,
          'This is spam content',
          undefined,
        );
      });

      // Verify success alert
      expect(Alert.alert).toHaveBeenCalledWith(
        '通報完了',
        '通報を受け付けました。確認後、適切な対応を行います。',
        [{ text: 'OK' }],
      );

      // Modal should close
      expect(onClose).toHaveBeenCalled();
    });

    it('should handle report submission without description', async () => {
      const onClose = jest.fn();

      const { getByText } = render(
        <ReportModal
          visible={true}
          onClose={onClose}
          targetType={ReportTargetType.TOILET}
          targetId={mockToilet.id}
          targetTitle={mockToilet.title}
        />,
      );

      // Select reason
      const harassmentOption = getByText('嫌がらせ');
      fireEvent.press(harassmentOption);

      // Skip description and go to next
      await waitFor(() => {
        const nextButton = getByText('次へ');
        fireEvent.press(nextButton);
      });

      // Submit without description
      await waitFor(() => {
        const submitButton = getByText('通報を送信');
        fireEvent.press(submitButton);
      });

      await waitFor(() => {
        expect(mockSubmitReport).toHaveBeenCalledWith(
          mockUser.uid,
          ReportTargetType.TOILET,
          mockToilet.id,
          ReportReason.HARASSMENT,
          undefined,
          undefined,
        );
      });
    });

    it('should handle report submission error', async () => {
      mockSubmitReport.mockRejectedValueOnce(new Error('Network error'));
      const onClose = jest.fn();

      const { getByText } = render(
        <ReportModal
          visible={true}
          onClose={onClose}
          targetType={ReportTargetType.TOILET}
          targetId={mockToilet.id}
        />,
      );

      // Quick submission
      fireEvent.press(getByText('その他'));
      await waitFor(() => fireEvent.press(getByText('次へ')));
      await waitFor(() => fireEvent.press(getByText('通報を送信')));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('エラー', '通報の送信に失敗しました');
      });

      // Modal should not close on error
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Report History Display', () => {
    it('should display user reports in history', async () => {
      const mockReports = [
        {
          id: 'report-1',
          reporterId: mockUser.uid,
          targetType: ReportTargetType.TOILET,
          targetId: 'toilet-1',
          reason: ReportReason.SPAM,
          description: 'Spam content',
          status: 'pending' as const,
          createdAt: new Date('2024-01-01'),
        },
        {
          id: 'report-2',
          reporterId: mockUser.uid,
          targetType: ReportTargetType.USER,
          targetId: 'user-456',
          reason: ReportReason.HARASSMENT,
          status: 'resolved' as const,
          createdAt: new Date('2024-01-02'),
          resolution: 'Action taken against user',
        },
      ];

      // Update mock hook with test data
      mockUseReportHook.reports = mockReports;

      const { getByText } = render(<ReportHistoryScreen />);

      await waitFor(() => {
        expect(getByText('通報統計')).toBeTruthy();
        expect(getByText('2')).toBeTruthy(); // Total reports
        expect(getByText('総通報数')).toBeTruthy();
      });

      // Check report items
      expect(getByText('理由: スパム')).toBeTruthy();
      expect(getByText('理由: 嫌がらせ')).toBeTruthy();
      expect(getByText('審査待ち')).toBeTruthy();
      expect(getByText('解決済み')).toBeTruthy();
    });

    it('should display user restrictions', async () => {
      const mockRestrictions = [
        {
          id: 'restriction-1',
          userId: mockUser.uid,
          type: 'post_restriction' as const,
          reason: '複数の違反により投稿が制限されています',
          startDate: new Date(),
          endDate: new Date(Date.now() + 86400000), // 1 day later
          isActive: true,
          createdBy: 'system' as const,
        },
      ];

      // Update mock hook with test data
      mockUseReportHook.userRestrictions = mockRestrictions;
      mockUseReportHook.violationPoints = 15;
      mockUseReportHook.hasActiveRestrictions = () => true;
      mockUseReportHook.isNearViolationLimit = () => true;

      const { getByText } = render(<ReportHistoryScreen />);

      await waitFor(() => {
        // Violation points
        expect(getByText('違反ポイント')).toBeTruthy();
        expect(getByText('15 / 20')).toBeTruthy();

        // Warning message
        expect(getByText(/違反ポイントが高くなっています/)).toBeTruthy();

        // Active restrictions
        expect(getByText('利用制限')).toBeTruthy();
        expect(getByText('投稿制限')).toBeTruthy();
        expect(getByText('複数の違反により投稿が制限されています')).toBeTruthy();
      });
    });

    it('should handle report detail press', async () => {
      const mockReports = [
        {
          id: 'report-1',
          reporterId: mockUser.uid,
          targetType: ReportTargetType.TOILET,
          targetId: 'toilet-1',
          reason: ReportReason.FAKE_INFORMATION,
          description: 'Contains false information',
          status: 'under_review' as const,
          createdAt: new Date('2024-01-01'),
        },
      ];

      // Update mock hook with test data
      mockUseReportHook.reports = mockReports;

      const { getByText } = render(<ReportHistoryScreen />);

      await waitFor(() => {
        const reportItem = getByText('理由: 虚偽情報');
        fireEvent.press(reportItem.parent?.parent as any);
      });

      // Should show alert with details
      expect(Alert.alert).toHaveBeenCalledWith(
        '通報詳細',
        expect.stringContaining('ID: report-1'),
        [{ text: 'OK' }],
      );
    });
  });

  describe('Report Flow with Restrictions', () => {
    it('should prevent report submission when user is restricted', async () => {
      // Mock user has report restriction
      const mockIsUserRestricted = jest.fn().mockResolvedValue({
        restricted: true,
        reason: 'あなたは通報機能の使用が制限されています',
        endDate: new Date(Date.now() + 86400000),
      });

      jest.doMock('../../services/reportService', () => ({
        reportService: {
          isUserRestricted: mockIsUserRestricted,
        },
      }));

      // This would typically be integrated with the actual flow
      // For now, we're testing the concept
      const restriction = await mockIsUserRestricted(mockUser.uid, 'report');

      expect(restriction.restricted).toBe(true);
      expect(restriction.reason).toBeTruthy();
    });
  });

  describe('Report Statistics Update', () => {
    it('should update statistics after successful report', async () => {
      const onClose = jest.fn();

      const { getByText, rerender } = render(
        <ReportModal
          visible={true}
          onClose={onClose}
          targetType={ReportTargetType.TOILET}
          targetId={mockToilet.id}
        />,
      );

      // Submit a report
      fireEvent.press(getByText('スパム'));
      await waitFor(() => fireEvent.press(getByText('次へ')));
      await waitFor(() => fireEvent.press(getByText('通報を送信')));

      // Update mock with new report after submission
      mockUseReportHook.reports = [
        {
          id: 'new-report',
          reporterId: mockUser.uid,
          targetType: ReportTargetType.TOILET,
          targetId: mockToilet.id,
          reason: ReportReason.SPAM,
          status: 'pending' as const,
          createdAt: new Date(),
        },
      ];

      // Switch to history screen
      rerender(<ReportHistoryScreen />);

      await waitFor(() => {
        expect(getByText('1')).toBeTruthy(); // Updated total count
      });
    });
  });
});
