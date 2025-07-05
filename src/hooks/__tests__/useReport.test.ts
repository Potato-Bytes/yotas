import { renderHook, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useReport } from '../useReport';
import { ReportTargetType, ReportReason, ReportStatus } from '../../types/post';

// Mock dependencies
jest.mock('../../services/reportService');
jest.mock('../../stores/authStore');
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

const mockReportService = {
  submitReport: jest.fn(),
  getUserReports: jest.fn(),
  getUserRestrictions: jest.fn(),
  getUserViolationPoints: jest.fn(),
  isUserRestricted: jest.fn(),
};

const mockUseAuth = {
  user: { uid: 'test-user-id' },
};

jest.mock('../../services/reportService', () => ({
  reportService: mockReportService,
}));

jest.mock('../../stores/authStore', () => ({
  useAuth: () => mockUseAuth,
}));

describe('useReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReportService.submitReport.mockResolvedValue(undefined);
    mockReportService.getUserReports.mockResolvedValue([]);
    mockReportService.getUserRestrictions.mockResolvedValue([]);
    mockReportService.getUserViolationPoints.mockResolvedValue(0);
    mockReportService.isUserRestricted.mockResolvedValue({ restricted: false });
  });

  describe('submitReport', () => {
    it('should submit report successfully', async () => {
      const { result } = renderHook(() => useReport());

      await act(async () => {
        const success = await result.current.submitReport(
          ReportTargetType.TOILET,
          'toilet-123',
          ReportReason.SPAM,
          'Test description',
        );
        expect(success).toBe(true);
      });

      expect(mockReportService.submitReport).toHaveBeenCalledWith(
        'test-user-id',
        ReportTargetType.TOILET,
        'toilet-123',
        ReportReason.SPAM,
        'Test description',
        undefined,
      );
      expect(Alert.alert).toHaveBeenCalledWith(
        '通報完了',
        '通報を受け付けました。確認後、適切な対応を行います。',
        [{ text: 'OK' }],
      );
    });

    it('should handle submit error', async () => {
      mockReportService.submitReport.mockRejectedValue(new Error('Submit failed'));
      const { result } = renderHook(() => useReport());

      await act(async () => {
        const success = await result.current.submitReport(
          ReportTargetType.TOILET,
          'toilet-123',
          ReportReason.SPAM,
        );
        expect(success).toBe(false);
      });

      expect(Alert.alert).toHaveBeenCalledWith('エラー', '通報の送信に失敗しました');
    });

    it('should show error when user is not logged in', async () => {
      mockUseAuth.user = null;
      const { result } = renderHook(() => useReport());

      await act(async () => {
        const success = await result.current.submitReport(
          ReportTargetType.TOILET,
          'toilet-123',
          ReportReason.SPAM,
        );
        expect(success).toBe(false);
      });

      expect(Alert.alert).toHaveBeenCalledWith('エラー', 'ログインが必要です');
    });
  });

  describe('checkRestriction', () => {
    it('should check user restriction for specific action', async () => {
      mockReportService.isUserRestricted.mockResolvedValue({
        restricted: true,
        reason: 'Test restriction',
        endDate: new Date(),
      });

      const { result } = renderHook(() => useReport());

      await act(async () => {
        const restriction = await result.current.checkRestriction('post');
        expect(restriction.restricted).toBe(true);
        expect(restriction.reason).toBe('Test restriction');
      });

      expect(mockReportService.isUserRestricted).toHaveBeenCalledWith('test-user-id', 'post');
    });

    it('should return not restricted when user is not logged in', async () => {
      mockUseAuth.user = null;
      const { result } = renderHook(() => useReport());

      await act(async () => {
        const restriction = await result.current.checkRestriction('post');
        expect(restriction.restricted).toBe(false);
      });
    });
  });

  describe('executeWithRestrictionCheck', () => {
    it('should execute callback when user is not restricted', async () => {
      mockReportService.isUserRestricted.mockResolvedValue({ restricted: false });
      const mockCallback = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useReport());

      await act(async () => {
        const success = await result.current.executeWithRestrictionCheck(
          'post',
          mockCallback,
          'テスト操作',
        );
        expect(success).toBe(true);
      });

      expect(mockCallback).toHaveBeenCalled();
      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it('should show restriction alert and not execute callback when user is restricted', async () => {
      mockReportService.isUserRestricted.mockResolvedValue({
        restricted: true,
        reason: 'あなたのアカウントは制限されています',
        endDate: new Date('2024-12-31'),
      });
      const mockCallback = jest.fn();
      const { result } = renderHook(() => useReport());

      await act(async () => {
        const success = await result.current.executeWithRestrictionCheck(
          'post',
          mockCallback,
          'テスト操作',
        );
        expect(success).toBe(false);
      });

      expect(mockCallback).not.toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        'テスト操作が制限されています',
        expect.stringContaining('あなたのアカウントは制限されています'),
        [{ text: 'OK' }],
      );
    });

    it('should handle callback errors', async () => {
      mockReportService.isUserRestricted.mockResolvedValue({ restricted: false });
      const mockCallback = jest.fn().mockRejectedValue(new Error('Callback error'));
      const { result } = renderHook(() => useReport());

      await act(async () => {
        const success = await result.current.executeWithRestrictionCheck('post', mockCallback);
        expect(success).toBe(false);
      });

      expect(mockCallback).toHaveBeenCalled();
    });
  });

  describe('helper functions', () => {
    it('should return correct reason display names', () => {
      const { result } = renderHook(() => useReport());

      expect(result.current.getReasonDisplayName(ReportReason.SPAM)).toBe('スパム');
      expect(result.current.getReasonDisplayName(ReportReason.INAPPROPRIATE_CONTENT)).toBe(
        '不適切なコンテンツ',
      );
      expect(result.current.getReasonDisplayName(ReportReason.HARASSMENT)).toBe('嫌がらせ');
    });

    it('should return correct status display names', () => {
      const { result } = renderHook(() => useReport());

      expect(result.current.getStatusDisplayName(ReportStatus.PENDING)).toBe('審査待ち');
      expect(result.current.getStatusDisplayName(ReportStatus.RESOLVED)).toBe('解決済み');
      expect(result.current.getStatusDisplayName(ReportStatus.DISMISSED)).toBe('却下');
    });

    it('should return correct status colors', () => {
      const { result } = renderHook(() => useReport());

      expect(result.current.getStatusColor(ReportStatus.PENDING)).toBe('#FF9800');
      expect(result.current.getStatusColor(ReportStatus.RESOLVED)).toBe('#4CAF50');
      expect(result.current.getStatusColor(ReportStatus.DISMISSED)).toBe('#757575');
    });
  });

  describe('state calculations', () => {
    it('should calculate risk levels correctly', async () => {
      mockReportService.getUserViolationPoints.mockResolvedValue(15);
      const { result } = renderHook(() => useReport());

      // Wait for initial data load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isNearViolationLimit()).toBe(true);
      expect(result.current.isHighRiskUser).toBe(true);
    });

    it('should detect active restrictions', async () => {
      mockReportService.getUserRestrictions.mockResolvedValue([
        {
          id: 'restriction-1',
          userId: 'test-user-id',
          type: 'post_restriction' as any,
          reason: 'Test',
          startDate: new Date(),
          isActive: true,
          createdBy: 'system' as any,
        },
      ]);

      const { result } = renderHook(() => useReport());

      // Wait for initial data load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.hasActiveRestrictions()).toBe(true);
      expect(result.current.activeRestrictionCount).toBe(1);
    });
  });

  describe('data loading', () => {
    it('should load user data on mount when user is logged in', async () => {
      renderHook(() => useReport());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockReportService.getUserReports).toHaveBeenCalledWith('test-user-id');
      expect(mockReportService.getUserRestrictions).toHaveBeenCalledWith('test-user-id');
      expect(mockReportService.getUserViolationPoints).toHaveBeenCalledWith('test-user-id');
    });

    it('should not load data when user is not logged in', () => {
      mockUseAuth.user = null;
      renderHook(() => useReport());

      expect(mockReportService.getUserReports).not.toHaveBeenCalled();
      expect(mockReportService.getUserRestrictions).not.toHaveBeenCalled();
      expect(mockReportService.getUserViolationPoints).not.toHaveBeenCalled();
    });

    it('should refresh all data when refresh is called', async () => {
      const { result } = renderHook(() => useReport());

      await act(async () => {
        await result.current.refresh();
      });

      expect(mockReportService.getUserReports).toHaveBeenCalledWith('test-user-id');
      expect(mockReportService.getUserRestrictions).toHaveBeenCalledWith('test-user-id');
      expect(mockReportService.getUserViolationPoints).toHaveBeenCalledWith('test-user-id');
    });
  });
});
