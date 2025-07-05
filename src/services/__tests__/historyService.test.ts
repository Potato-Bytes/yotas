import { HistoryService } from '../historyService';
import { ActivityType } from '../../types/post';
import { ToiletType } from '../../types/maps';

// Firebase mock
const mockFirestore = {
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      id: 'mock-doc-id',
      ref: {
        update: jest.fn(() => Promise.resolve()),
      },
      set: jest.fn(() => Promise.resolve()),
      get: jest.fn(() =>
        Promise.resolve({
          exists: false,
          data: () => null,
        }),
      ),
      update: jest.fn(() => Promise.resolve()),
    })),
    add: jest.fn(() => Promise.resolve({ id: 'mock-id' })),
    where: jest.fn(() => ({
      get: jest.fn(() =>
        Promise.resolve({
          empty: true,
          docs: [],
          forEach: jest.fn(),
        }),
      ),
      where: jest.fn(() => ({
        get: jest.fn(() =>
          Promise.resolve({
            empty: true,
            docs: [],
            forEach: jest.fn(),
          }),
        ),
      })),
      orderBy: jest.fn(() => ({
        limit: jest.fn(() => ({
          get: jest.fn(() =>
            Promise.resolve({
              empty: true,
              docs: [],
              forEach: jest.fn(),
            }),
          ),
        })),
        offset: jest.fn(() => ({
          get: jest.fn(() =>
            Promise.resolve({
              empty: true,
              docs: [],
              forEach: jest.fn(),
            }),
          ),
        })),
        desc: jest.fn(() => ({
          limit: jest.fn(() => ({
            get: jest.fn(() =>
              Promise.resolve({
                empty: true,
                docs: [],
                forEach: jest.fn(),
              }),
            ),
          })),
        })),
      })),
    })),
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

jest.mock('@react-native-firebase/firestore', () => ({
  __esModule: true,
  default: jest.fn(() => mockFirestore),
}));

describe('HistoryService', () => {
  let historyService: HistoryService;

  beforeEach(() => {
    historyService = new HistoryService();
    jest.clearAllMocks();
  });

  describe('recordView', () => {
    const mockToilet = {
      id: 'toilet-123',
      title: 'Test Toilet',
      type: ToiletType.PUBLIC,
      coordinates: { latitude: 35.6762, longitude: 139.6503 },
      description: 'Test description',
      rating: 4.5,
      reviewCount: 10,
      isAccessible: true,
      facilities: {
        hasWashlet: true,
        hasHandDryer: false,
        hasBabyChanging: false,
        hasMultiPurpose: false,
        hasPaperTowels: true,
        hasHandSoap: true,
        hasVendingMachine: false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      authorId: 'author-123',
    };

    it('should create new view history when no existing history', async () => {
      const userId = 'user-123';

      await historyService.recordView(userId, mockToilet);

      expect(mockFirestore.collection).toHaveBeenCalledWith('view_history');
      expect(mockFirestore.collection().add).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          toiletId: mockToilet.id,
          toiletTitle: mockToilet.title,
          toiletType: mockToilet.type,
          viewCount: 1,
        }),
      );
    });

    it('should update existing view history when record exists', async () => {
      const userId = 'user-123';
      const existingDoc = {
        data: () => ({ viewCount: 2 }),
        ref: { update: jest.fn(() => Promise.resolve()) },
      };

      mockFirestore
        .collection()
        .where()
        .where()
        .get.mockResolvedValueOnce({
          empty: false,
          docs: [existingDoc],
        });

      await historyService.recordView(userId, mockToilet);

      expect(existingDoc.ref.update).toHaveBeenCalledWith({
        viewedAt: expect.any(Object),
        viewCount: 3,
      });
    });

    it('should update user stats after recording view', async () => {
      const userId = 'user-123';
      const updateUserStatsSpy = jest.spyOn(historyService as any, 'updateUserStats');
      updateUserStatsSpy.mockResolvedValue(undefined);

      await historyService.recordView(userId, mockToilet);

      expect(updateUserStatsSpy).toHaveBeenCalledWith(userId, { totalViews: 1 });
    });

    it('should clean up old history records', async () => {
      const userId = 'user-123';
      const oldDocs = [{ ref: { delete: jest.fn() } }, { ref: { delete: jest.fn() } }];

      mockFirestore.collection().where().orderBy().offset().get.mockResolvedValueOnce({
        empty: false,
        docs: oldDocs,
      });

      const mockBatch = {
        delete: jest.fn(),
        commit: jest.fn(() => Promise.resolve()),
      };
      mockFirestore.batch.mockReturnValue(mockBatch);

      await historyService.recordView(userId, mockToilet);

      expect(mockBatch.delete).toHaveBeenCalledTimes(2);
      expect(mockBatch.commit).toHaveBeenCalled();
    });
  });

  describe('getViewHistory', () => {
    it('should retrieve view history for user', async () => {
      const userId = 'user-123';
      const mockDocs = [
        {
          id: 'history-1',
          data: () => ({
            userId,
            toiletId: 'toilet-1',
            toiletTitle: 'Toilet 1',
            toiletType: ToiletType.PUBLIC,
            viewedAt: { toDate: () => new Date('2024-01-01') },
            viewCount: 3,
          }),
        },
        {
          id: 'history-2',
          data: () => ({
            userId,
            toiletId: 'toilet-2',
            toiletTitle: 'Toilet 2',
            toiletType: ToiletType.STATION,
            viewedAt: { toDate: () => new Date('2024-01-02') },
            viewCount: 1,
          }),
        },
      ];

      mockFirestore
        .collection()
        .where()
        .orderBy()
        .limit()
        .get.mockResolvedValueOnce({
          forEach: (callback: any) => mockDocs.forEach(callback),
        });

      const history = await historyService.getViewHistory(userId, 10);

      expect(history).toHaveLength(2);
      expect(history[0].toiletTitle).toBe('Toilet 1');
      expect(history[0].viewCount).toBe(3);
      expect(history[1].toiletTitle).toBe('Toilet 2');
    });

    it('should return empty array on error', async () => {
      const userId = 'user-123';
      mockFirestore
        .collection()
        .where()
        .orderBy()
        .limit()
        .get.mockRejectedValue(new Error('Database error'));

      const history = await historyService.getViewHistory(userId);
      expect(history).toEqual([]);
    });
  });

  describe('addToFavorites', () => {
    const mockToilet = {
      id: 'toilet-123',
      title: 'Test Toilet',
      type: ToiletType.PUBLIC,
      coordinates: { latitude: 35.6762, longitude: 139.6503 },
      description: 'Test description',
      rating: 4.5,
      reviewCount: 10,
      isAccessible: true,
      facilities: {
        hasWashlet: true,
        hasHandDryer: false,
        hasBabyChanging: false,
        hasMultiPurpose: false,
        hasPaperTowels: true,
        hasHandSoap: true,
        hasVendingMachine: false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      authorId: 'author-123',
    };

    it('should add toilet to favorites successfully', async () => {
      const userId = 'user-123';

      await historyService.addToFavorites(userId, mockToilet);

      expect(mockFirestore.collection().add).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          toiletId: mockToilet.id,
          toiletTitle: mockToilet.title,
          toiletType: mockToilet.type,
        }),
      );
    });

    it('should reject duplicate favorites', async () => {
      const userId = 'user-123';

      mockFirestore
        .collection()
        .where()
        .where()
        .get.mockResolvedValueOnce({
          empty: false,
          docs: [{ id: 'existing-favorite' }],
        });

      await expect(historyService.addToFavorites(userId, mockToilet)).rejects.toThrow(
        '既にお気に入りに追加されています',
      );
    });

    it('should record activity when adding to favorites', async () => {
      const userId = 'user-123';
      const recordActivitySpy = jest.spyOn(historyService, 'recordActivity');
      recordActivitySpy.mockResolvedValue(undefined);

      await historyService.addToFavorites(userId, mockToilet);

      expect(recordActivitySpy).toHaveBeenCalledWith(
        userId,
        ActivityType.FAVORITE_ADDED,
        mockToilet.id,
        mockToilet.title,
        `「${mockToilet.title}」をお気に入りに追加しました`,
      );
    });
  });

  describe('getUserStats', () => {
    it('should return existing user stats', async () => {
      const userId = 'user-123';
      const mockStats = {
        userId,
        totalPosts: 5,
        totalViews: 100,
        totalFavorites: 10,
        totalHelpfulVotes: 25,
        totalBadges: 3,
        joinedAt: { toDate: () => new Date('2024-01-01') },
        lastActiveAt: { toDate: () => new Date('2024-01-15') },
        streak: 7,
      };

      mockFirestore
        .collection()
        .doc()
        .get.mockResolvedValueOnce({
          exists: true,
          data: () => mockStats,
        });

      const stats = await historyService.getUserStats(userId);

      expect(stats.totalPosts).toBe(5);
      expect(stats.totalViews).toBe(100);
      expect(stats.streak).toBe(7);
    });

    it('should create initial stats for new user', async () => {
      const userId = 'user-123';

      mockFirestore.collection().doc().get.mockResolvedValueOnce({
        exists: false,
      });

      const stats = await historyService.getUserStats(userId);

      expect(stats.totalPosts).toBe(0);
      expect(stats.totalViews).toBe(0);
      expect(stats.totalFavorites).toBe(0);
      expect(mockFirestore.collection().doc().set).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          totalPosts: 0,
          totalViews: 0,
          totalFavorites: 0,
        }),
      );
    });
  });

  describe('updateUserStats', () => {
    it('should update user stats correctly', async () => {
      const userId = 'user-123';
      const currentStats = {
        userId,
        totalPosts: 5,
        totalViews: 100,
        totalFavorites: 10,
        totalHelpfulVotes: 25,
        totalBadges: 3,
        joinedAt: new Date('2024-01-01'),
        lastActiveAt: new Date('2024-01-15'),
        streak: 7,
      };

      jest.spyOn(historyService, 'getUserStats').mockResolvedValue(currentStats);

      await historyService.updateUserStats(userId, {
        totalPosts: 1,
        totalViews: 5,
      });

      expect(mockFirestore.collection().doc().update).toHaveBeenCalledWith({
        totalPosts: 6, // 5 + 1
        totalViews: 105, // 100 + 5
        totalFavorites: 10, // unchanged
        totalHelpfulVotes: 25, // unchanged
        totalBadges: 3, // unchanged
        lastActiveAt: expect.any(Object),
      });
    });

    it('should not allow negative values', async () => {
      const userId = 'user-123';
      const currentStats = {
        userId,
        totalPosts: 2,
        totalViews: 5,
        totalFavorites: 1,
        totalHelpfulVotes: 0,
        totalBadges: 0,
        joinedAt: new Date('2024-01-01'),
        lastActiveAt: new Date('2024-01-15'),
        streak: 0,
      };

      jest.spyOn(historyService, 'getUserStats').mockResolvedValue(currentStats);

      await historyService.updateUserStats(userId, {
        totalPosts: -5, // Should result in 0
        totalFavorites: -2, // Should result in 0
      });

      expect(mockFirestore.collection().doc().update).toHaveBeenCalledWith(
        expect.objectContaining({
          totalPosts: 0,
          totalFavorites: 0,
        }),
      );
    });
  });

  describe('clearViewHistory', () => {
    it('should clear all view history for user', async () => {
      const userId = 'user-123';
      const mockDocs = [{ ref: { delete: jest.fn() } }, { ref: { delete: jest.fn() } }];

      mockFirestore.collection().where().get.mockResolvedValueOnce({
        docs: mockDocs,
      });

      const mockBatch = {
        delete: jest.fn(),
        commit: jest.fn(() => Promise.resolve()),
      };
      mockFirestore.batch.mockReturnValue(mockBatch);

      await historyService.clearViewHistory(userId);

      expect(mockBatch.delete).toHaveBeenCalledTimes(2);
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('should throw error when clearing fails', async () => {
      const userId = 'user-123';
      mockFirestore.collection().where().get.mockRejectedValue(new Error('Database error'));

      await expect(historyService.clearViewHistory(userId)).rejects.toThrow(
        '履歴の削除に失敗しました',
      );
    });
  });

  describe('getFrequentlyViewed', () => {
    it('should return frequently viewed toilets ordered by view count', async () => {
      const userId = 'user-123';
      const mockDocs = [
        {
          id: 'history-1',
          data: () => ({
            userId,
            toiletId: 'toilet-1',
            toiletTitle: 'Most Viewed Toilet',
            toiletType: ToiletType.PUBLIC,
            viewedAt: { toDate: () => new Date() },
            viewCount: 15,
          }),
        },
        {
          id: 'history-2',
          data: () => ({
            userId,
            toiletId: 'toilet-2',
            toiletTitle: 'Second Most Viewed',
            toiletType: ToiletType.STATION,
            viewedAt: { toDate: () => new Date() },
            viewCount: 8,
          }),
        },
      ];

      mockFirestore
        .collection()
        .where()
        .orderBy()
        .limit()
        .get.mockResolvedValueOnce({
          forEach: (callback: any) => mockDocs.forEach(callback),
        });

      const frequently = await historyService.getFrequentlyViewed(userId, 5);

      expect(frequently).toHaveLength(2);
      expect(frequently[0].viewCount).toBe(15);
      expect(frequently[1].viewCount).toBe(8);
      expect(mockFirestore.collection().where).toHaveBeenCalledWith('userId', '==', userId);
      expect(mockFirestore.collection().where().orderBy).toHaveBeenCalledWith('viewCount', 'desc');
    });
  });
});
