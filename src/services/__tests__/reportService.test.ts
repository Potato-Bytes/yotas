// Firebase mock (must be before imports)
jest.mock('@react-native-firebase/firestore', () => {
  const createQueryMock = (): any => ({
    where: jest.fn(() => createQueryMock()),
    orderBy: jest.fn(() => createQueryMock()),
    limit: jest.fn(() => createQueryMock()),
    offset: jest.fn(() => createQueryMock()),
    get: jest.fn(() =>
      Promise.resolve({
        empty: true,
        docs: [],
        size: 0,
        forEach: jest.fn(),
      }),
    ),
  });

  const mockFirestore = {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        id: 'mock-doc-id',
        set: jest.fn(() => Promise.resolve()),
        get: jest.fn(() =>
          Promise.resolve({
            exists: false,
            data: () => null,
          }),
        ),
        update: jest.fn(() => Promise.resolve()),
      })),
      add: jest.fn(() => Promise.resolve({ id: 'mock-report-id' })),
      ...createQueryMock(),
    })),
    Timestamp: {
      now: jest.fn(() => ({ toDate: () => new Date() })),
      fromDate: jest.fn(date => ({ toDate: () => date })),
    },
    batch: jest.fn(() => ({
      delete: jest.fn(),
      commit: jest.fn(() => Promise.resolve()),
    })),
  };

  return {
    __esModule: true,
    default: jest.fn(() => mockFirestore),
  };
});

import { ReportService } from '../reportService';
import {
  ReportTargetType,
  ReportReason,
  ReportStatus,
  ViolationType,
  ViolationSeverity,
  RestrictionType,
} from '../../types/post';

describe('ReportService', () => {
  let reportService: ReportService;
  let mockFirestore: any;

  beforeEach(() => {
    // Get the mocked firestore instance
    const firestore = require('@react-native-firebase/firestore').default;
    mockFirestore = firestore();

    reportService = new ReportService();
    jest.clearAllMocks();
  });

  describe('submitReport', () => {
    it('should submit a new report successfully', async () => {
      const reporterId = 'user-123';
      const targetType = ReportTargetType.TOILET;
      const targetId = 'toilet-456';
      const reason = ReportReason.INAPPROPRIATE_CONTENT;
      const description = 'Test report description';

      await reportService.submitReport(reporterId, targetType, targetId, reason, description);

      expect(mockFirestore.collection).toHaveBeenCalledWith('reports');
      expect(mockFirestore.collection().add).toHaveBeenCalledWith(
        expect.objectContaining({
          reporterId,
          targetType,
          targetId,
          reason,
          description,
          status: ReportStatus.PENDING,
        }),
      );
    });

    it('should reject duplicate reports', async () => {
      // Mock existing report
      mockFirestore
        .collection()
        .where()
        .get.mockResolvedValueOnce({
          empty: false,
          docs: [{ id: 'existing-report' }],
        });

      const reporterId = 'user-123';
      const targetType = ReportTargetType.TOILET;
      const targetId = 'toilet-456';
      const reason = ReportReason.SPAM;

      await expect(
        reportService.submitReport(reporterId, targetType, targetId, reason),
      ).rejects.toThrow('この対象は既に通報済みです');
    });
  });

  describe('addViolationRecord', () => {
    it('should add violation record and check for restrictions', async () => {
      const userId = 'user-123';
      const type = ViolationType.SPAM_POSTING;
      const severity = ViolationSeverity.MEDIUM;
      const description = 'Spam violation';

      // Mock getUserViolationPoints to return high points
      jest.spyOn(reportService, 'getUserViolationPoints').mockResolvedValue(5);

      await reportService.addViolationRecord(userId, type, severity, description);

      expect(mockFirestore.collection).toHaveBeenCalledWith('violation_records');
      expect(mockFirestore.collection().add).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          type,
          severity,
          description,
          autoDetected: false,
          points: 3, // MEDIUM severity = 3 points
        }),
      );
    });
  });

  describe('getUserViolationPoints', () => {
    it('should calculate total violation points correctly', async () => {
      const userId = 'user-123';
      const mockDocs = [
        { data: () => ({ points: 3 }) },
        { data: () => ({ points: 5 }) },
        { data: () => ({ points: 2 }) },
      ];

      mockFirestore
        .collection()
        .where()
        .where()
        .get.mockResolvedValueOnce({
          forEach: (callback: any) => mockDocs.forEach(callback),
        });

      const points = await reportService.getUserViolationPoints(userId);
      expect(points).toBe(10);
    });

    it('should return 0 when user has no violations', async () => {
      const userId = 'user-123';
      mockFirestore
        .collection()
        .where()
        .where()
        .get.mockResolvedValueOnce({
          forEach: () => {},
        });

      const points = await reportService.getUserViolationPoints(userId);
      expect(points).toBe(0);
    });
  });

  describe('getUserRestrictions', () => {
    it('should return active restrictions for user', async () => {
      const userId = 'user-123';
      const mockRestrictions = [
        {
          id: 'restriction-1',
          data: () => ({
            userId,
            type: RestrictionType.POST_RESTRICTION,
            reason: 'Spam violation',
            startDate: { toDate: () => new Date() },
            endDate: { toDate: () => new Date(Date.now() + 86400000) }, // 1 day later
            isActive: true,
            createdBy: 'system',
          }),
        },
      ];

      mockFirestore
        .collection()
        .where()
        .where()
        .orderBy()
        .get.mockResolvedValueOnce({
          forEach: (callback: any) => mockRestrictions.forEach(callback),
        });

      const restrictions = await reportService.getUserRestrictions(userId);
      expect(restrictions).toHaveLength(1);
      expect(restrictions[0].type).toBe(RestrictionType.POST_RESTRICTION);
    });
  });

  describe('isUserRestricted', () => {
    it('should return true when user has applicable restriction', async () => {
      const userId = 'user-123';

      // Mock getUserRestrictions to return a post restriction
      jest.spyOn(reportService, 'getUserRestrictions').mockResolvedValue([
        {
          id: 'restriction-1',
          userId,
          type: RestrictionType.POST_RESTRICTION,
          reason: 'Test restriction',
          startDate: new Date(),
          endDate: new Date(Date.now() + 86400000),
          isActive: true,
          createdBy: 'system',
        },
      ]);

      const result = await reportService.isUserRestricted(userId, 'post');
      expect(result.restricted).toBe(true);
      expect(result.reason).toBe('Test restriction');
    });

    it('should return false when user has no applicable restrictions', async () => {
      const userId = 'user-123';

      // Mock getUserRestrictions to return no restrictions
      jest.spyOn(reportService, 'getUserRestrictions').mockResolvedValue([]);

      const result = await reportService.isUserRestricted(userId, 'post');
      expect(result.restricted).toBe(false);
    });

    it('should check permanent ban for all actions', async () => {
      const userId = 'user-123';

      // Mock getUserRestrictions to return a permanent ban
      jest.spyOn(reportService, 'getUserRestrictions').mockResolvedValue([
        {
          id: 'restriction-1',
          userId,
          type: RestrictionType.PERMANENT_BAN,
          reason: 'Permanent ban',
          startDate: new Date(),
          isActive: true,
          createdBy: 'system',
        },
      ]);

      const postResult = await reportService.isUserRestricted(userId, 'post');
      const commentResult = await reportService.isUserRestricted(userId, 'comment');
      const reviewResult = await reportService.isUserRestricted(userId, 'review');
      const voteResult = await reportService.isUserRestricted(userId, 'vote');

      expect(postResult.restricted).toBe(true);
      expect(commentResult.restricted).toBe(true);
      expect(reviewResult.restricted).toBe(true);
      expect(voteResult.restricted).toBe(true);
    });
  });

  describe('getReportCountForTarget', () => {
    it('should count reports for a specific target', async () => {
      const targetType = ReportTargetType.TOILET;
      const targetId = 'toilet-123';

      mockFirestore.collection().where().where().where().get.mockResolvedValueOnce({
        size: 3,
      });

      const count = await (reportService as any).getReportCountForTarget(targetType, targetId);
      expect(count).toBe(3);
    });
  });

  describe('violation points calculation', () => {
    it('should assign correct points for each severity level', () => {
      const getViolationPoints = (reportService as any).getViolationPoints.bind(reportService);

      expect(getViolationPoints(ViolationSeverity.LOW)).toBe(1);
      expect(getViolationPoints(ViolationSeverity.MEDIUM)).toBe(3);
      expect(getViolationPoints(ViolationSeverity.HIGH)).toBe(6);
      expect(getViolationPoints(ViolationSeverity.CRITICAL)).toBe(12);
    });
  });

  describe('auto-detection', () => {
    it('should trigger violation when report count reaches threshold', async () => {
      const targetType = ReportTargetType.TOILET;
      const targetId = 'toilet-123';
      const reason = ReportReason.SPAM;

      // Mock getReportCountForTarget to return 3 (threshold)
      jest.spyOn(reportService as any, 'getReportCountForTarget').mockResolvedValue(3);

      // Mock getTargetOwnerId to return a user ID
      jest.spyOn(reportService as any, 'getTargetOwnerId').mockResolvedValue('owner-123');

      // Mock addViolationRecord
      const addViolationSpy = jest.spyOn(reportService, 'addViolationRecord').mockResolvedValue();

      await (reportService as any).processAutoDetection(targetType, targetId, reason);

      expect(addViolationSpy).toHaveBeenCalledWith(
        'owner-123',
        ViolationType.SPAM_POSTING,
        ViolationSeverity.MEDIUM,
        '複数の通報により自動検出: spam',
        undefined,
        undefined,
        true,
      );
    });
  });
});
