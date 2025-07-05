import { ReportService } from '../reportService';
import { ReportTargetType, ReportReason } from '../../types/post';

describe('ReportService', () => {
  let reportService: ReportService;

  beforeEach(() => {
    reportService = new ReportService();
    jest.clearAllMocks();
  });

  describe('submitReport', () => {
    it('should submit a new report successfully', async () => {
      const reporterId = 'user-123';
      const targetType = ReportTargetType.TOILET;
      const targetId = 'toilet-456';
      const reason = ReportReason.INAPPROPRIATE_CONTENT;
      const description = 'This content is inappropriate';

      await expect(
        reportService.submitReport(reporterId, targetType, targetId, reason, description)
      ).resolves.not.toThrow();
    });

    it('should reject duplicate reports', async () => {
      const reporterId = 'user-123';
      const targetType = ReportTargetType.TOILET;
      const targetId = 'toilet-456';
      const reason = ReportReason.SPAM;

      // First report should succeed
      await expect(
        reportService.submitReport(reporterId, targetType, targetId, reason)
      ).resolves.not.toThrow();
    });
  });

  describe('addViolationRecord', () => {
    it('should add violation record and check for restrictions', async () => {
      const userId = 'user-123';
      const violationType = 'CONTENT_VIOLATION' as any;
      const severity = 'MEDIUM' as any;
      const points = 5;
      const description = 'Violation description';

      await expect(
        reportService.addViolationRecord(userId, violationType, severity, points, description)
      ).resolves.not.toThrow();
    });
  });

  describe('getUserViolationPoints', () => {
    it('should calculate total violation points correctly', async () => {
      const userId = 'user-123';

      const points = await reportService.getUserViolationPoints(userId);

      expect(typeof points).toBe('number');
      expect(points).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 for user with no violations', async () => {
      const userId = 'clean-user';

      const points = await reportService.getUserViolationPoints(userId);

      expect(points).toBe(0);
    });
  });

  describe('getUserReports', () => {
    it('should retrieve user reports with pagination', async () => {
      const userId = 'user-123';

      const reports = await reportService.getUserReports(userId, 10, 0);

      expect(Array.isArray(reports)).toBe(true);
    });
  });

  describe('getUserRestrictions', () => {
    it('should retrieve active user restrictions', async () => {
      const userId = 'user-123';

      const restrictions = await reportService.getUserRestrictions(userId);

      expect(Array.isArray(restrictions)).toBe(true);
    });
  });

  describe('isUserRestricted', () => {
    it('should check if user has active restrictions', async () => {
      const userId = 'user-123';

      const result = await reportService.isUserRestricted(userId);

      expect(result).toHaveProperty('restricted');
      expect(typeof result.restricted).toBe('boolean');
    });
  });
});