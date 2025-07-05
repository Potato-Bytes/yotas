import { SearchService } from '../searchService';
import { SearchFilters, SortOption } from '../../types/post';
import { ToiletType } from '../../types/maps';

// Mock Firebase
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
      delete: jest.fn(() => Promise.resolve()),
    })),
    add: jest.fn(() => Promise.resolve({ id: 'mock-id' })),
    where: jest.fn(() => ({
      get: jest.fn(() =>
        Promise.resolve({
          empty: true,
          docs: [],
          forEach: jest.fn(),
          size: 0,
        }),
      ),
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
      })),
    })),
    get: jest.fn(() =>
      Promise.resolve({
        empty: true,
        docs: [],
        forEach: jest.fn(),
      }),
    ),
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
    })),
  })),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date() })),
    fromDate: jest.fn(date => ({ toDate: () => date })),
  },
};

jest.mock('@react-native-firebase/firestore', () => ({
  __esModule: true,
  default: jest.fn(() => mockFirestore),
}));

describe('SearchService', () => {
  let searchService: SearchService;

  beforeEach(() => {
    searchService = new SearchService();
    jest.clearAllMocks();
  });

  describe('searchToilets', () => {
    const mockToilets = [
      {
        id: 'toilet-1',
        data: () => ({
          title: 'Central Station Toilet',
          type: ToiletType.STATION,
          description: 'Clean and accessible',
          rating: 4.5,
          reviewCount: 20,
          isAccessible: true,
          location: { latitude: 35.6762, longitude: 139.6503 },
          facilities: { hasWashlet: true },
          createdAt: { toDate: () => new Date('2024-01-01') },
        }),
      },
      {
        id: 'toilet-2',
        data: () => ({
          title: 'Park Public Toilet',
          type: ToiletType.PARK,
          description: 'Outdoor facility',
          rating: 3.8,
          reviewCount: 15,
          isAccessible: false,
          location: { latitude: 35.6763, longitude: 139.6504 },
          facilities: { hasWashlet: false },
          createdAt: { toDate: () => new Date('2024-01-02') },
        }),
      },
    ];

    it('should search toilets with text query', async () => {
      mockFirestore.collection().get.mockResolvedValueOnce({
        forEach: (callback: any) => mockToilets.forEach(callback),
      });

      const filters: SearchFilters = {
        query: 'station',
        sortBy: SortOption.RELEVANCE,
      };

      const result = await searchService.searchToilets(filters);

      expect(result.toilets).toHaveLength(1);
      expect(result.toilets[0].title).toBe('Central Station Toilet');
      expect(result.totalCount).toBe(1);
    });

    it('should filter by toilet type', async () => {
      mockFirestore.collection().get.mockResolvedValueOnce({
        forEach: (callback: any) => mockToilets.forEach(callback),
      });

      const filters: SearchFilters = {
        query: '',
        toiletType: ToiletType.PARK,
        sortBy: SortOption.RELEVANCE,
      };

      const result = await searchService.searchToilets(filters);

      expect(result.toilets).toHaveLength(1);
      expect(result.toilets[0].title).toBe('Park Public Toilet');
    });

    it('should filter by accessibility', async () => {
      mockFirestore.collection().get.mockResolvedValueOnce({
        forEach: (callback: any) => mockToilets.forEach(callback),
      });

      const filters: SearchFilters = {
        query: '',
        isAccessible: true,
        sortBy: SortOption.RELEVANCE,
      };

      const result = await searchService.searchToilets(filters);

      expect(result.toilets).toHaveLength(1);
      expect(result.toilets[0].title).toBe('Central Station Toilet');
    });

    it('should filter by minimum rating', async () => {
      mockFirestore.collection().get.mockResolvedValueOnce({
        forEach: (callback: any) => mockToilets.forEach(callback),
      });

      const filters: SearchFilters = {
        query: '',
        rating: 4.0,
        sortBy: SortOption.RELEVANCE,
      };

      const result = await searchService.searchToilets(filters);

      expect(result.toilets).toHaveLength(1);
      expect(result.toilets[0].rating).toBeGreaterThanOrEqual(4.0);
    });

    it('should filter by facilities', async () => {
      mockFirestore.collection().get.mockResolvedValueOnce({
        forEach: (callback: any) => mockToilets.forEach(callback),
      });

      const filters: SearchFilters = {
        query: '',
        hasWashlet: true,
        sortBy: SortOption.RELEVANCE,
      };

      const result = await searchService.searchToilets(filters);

      expect(result.toilets).toHaveLength(1);
      expect(result.toilets[0].title).toBe('Central Station Toilet');
    });

    it('should sort by distance when user location provided', async () => {
      mockFirestore.collection().get.mockResolvedValueOnce({
        forEach: (callback: any) => mockToilets.forEach(callback),
      });

      const filters: SearchFilters = {
        query: '',
        sortBy: SortOption.DISTANCE,
      };

      const userLocation = { latitude: 35.6762, longitude: 139.6503 };

      const result = await searchService.searchToilets(filters, userLocation);

      expect(result.toilets).toHaveLength(2);
      // Closest toilet should be first
      expect(result.toilets[0].title).toBe('Central Station Toilet');
    });

    it('should sort by rating', async () => {
      mockFirestore.collection().get.mockResolvedValueOnce({
        forEach: (callback: any) => mockToilets.forEach(callback),
      });

      const filters: SearchFilters = {
        query: '',
        sortBy: SortOption.RATING,
      };

      const result = await searchService.searchToilets(filters);

      expect(result.toilets).toHaveLength(2);
      // Higher rated toilet should be first
      expect(result.toilets[0].rating).toBeGreaterThan(result.toilets[1].rating);
    });

    it('should sort by newest', async () => {
      mockFirestore.collection().get.mockResolvedValueOnce({
        forEach: (callback: any) => mockToilets.forEach(callback),
      });

      const filters: SearchFilters = {
        query: '',
        sortBy: SortOption.NEWEST,
      };

      const result = await searchService.searchToilets(filters);

      expect(result.toilets).toHaveLength(2);
      // Newer toilet should be first
      expect(result.toilets[0].title).toBe('Park Public Toilet');
    });

    it('should handle pagination', async () => {
      mockFirestore.collection().get.mockResolvedValueOnce({
        forEach: (callback: any) => mockToilets.forEach(callback),
      });

      const filters: SearchFilters = {
        query: '',
        sortBy: SortOption.RELEVANCE,
      };

      const result = await searchService.searchToilets(filters, undefined, 1, 1);

      expect(result.toilets).toHaveLength(1);
      expect(result.hasMore).toBe(true);
    });

    it('should return empty result when no toilets match', async () => {
      mockFirestore.collection().get.mockResolvedValueOnce({
        forEach: jest.fn(),
      });

      const filters: SearchFilters = {
        query: 'nonexistent',
        sortBy: SortOption.RELEVANCE,
      };

      const result = await searchService.searchToilets(filters);

      expect(result.toilets).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('saveFavoriteSearch', () => {
    it('should save favorite search successfully', async () => {
      const userId = 'user-123';
      const name = 'My Favorite Search';
      const filters: SearchFilters = {
        query: 'station',
        toiletType: ToiletType.STATION,
        sortBy: SortOption.DISTANCE,
      };

      await searchService.saveFavoriteSearch(userId, name, filters);

      expect(mockFirestore.collection).toHaveBeenCalledWith('saved_searches');
      expect(mockFirestore.collection().add).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          name,
          filters,
        }),
      );
    });
  });

  describe('getSavedSearches', () => {
    it('should retrieve saved searches for user', async () => {
      const userId = 'user-123';
      const mockSavedSearches = [
        {
          id: 'search-1',
          data: () => ({
            userId,
            name: 'Station Toilets',
            filters: { query: 'station', sortBy: SortOption.DISTANCE },
            createdAt: { toDate: () => new Date('2024-01-01') },
            lastUsed: { toDate: () => new Date('2024-01-05') },
          }),
        },
      ];

      mockFirestore
        .collection()
        .where()
        .orderBy()
        .get.mockResolvedValueOnce({
          forEach: (callback: any) => mockSavedSearches.forEach(callback),
        });

      const searches = await searchService.getSavedSearches(userId);

      expect(searches).toHaveLength(1);
      expect(searches[0].name).toBe('Station Toilets');
      expect(searches[0].filters.query).toBe('station');
    });
  });

  describe('saveSearchHistory', () => {
    it('should save search history successfully', async () => {
      const userId = 'user-123';
      const filters: SearchFilters = {
        query: 'park',
        sortBy: SortOption.RATING,
      };
      const resultCount = 5;

      await searchService.saveSearchHistory(userId, filters, resultCount);

      expect(mockFirestore.collection).toHaveBeenCalledWith('search_history');
      expect(mockFirestore.collection().add).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          query: 'park',
          filters,
          resultCount,
        }),
      );
    });

    it('should not save empty queries', async () => {
      const userId = 'user-123';
      const filters: SearchFilters = {
        query: '',
        sortBy: SortOption.RELEVANCE,
      };

      await searchService.saveSearchHistory(userId, filters, 0);

      expect(mockFirestore.collection().add).not.toHaveBeenCalled();
    });

    it('should limit search history to 50 entries', async () => {
      const userId = 'user-123';
      const filters: SearchFilters = {
        query: 'test',
        sortBy: SortOption.RELEVANCE,
      };

      const oldSearches = Array(5)
        .fill(null)
        .map((_, i) => ({
          ref: { delete: jest.fn() },
        }));

      mockFirestore.collection().where().orderBy().offset().get.mockResolvedValueOnce({
        empty: false,
        docs: oldSearches,
      });

      const mockBatch = {
        delete: jest.fn(),
        commit: jest.fn(() => Promise.resolve()),
      };
      mockFirestore.batch = jest.fn(() => mockBatch);

      await searchService.saveSearchHistory(userId, filters, 5);

      expect(mockBatch.delete).toHaveBeenCalledTimes(5);
      expect(mockBatch.commit).toHaveBeenCalled();
    });
  });

  describe('deleteSavedSearch', () => {
    it('should delete saved search successfully', async () => {
      const searchId = 'search-123';

      await searchService.deleteSavedSearch(searchId);

      expect(mockFirestore.collection().doc).toHaveBeenCalledWith(searchId);
      expect(mockFirestore.collection().doc().delete).toHaveBeenCalled();
    });
  });

  describe('text matching', () => {
    it('should match text in title', () => {
      const toilet = { title: 'Central Station', description: 'Clean toilet' };
      const result = (searchService as any).matchesTextSearch(toilet, 'station');
      expect(result).toBe(true);
    });

    it('should match text in description', () => {
      const toilet = { title: 'Public Toilet', description: 'Near the park entrance' };
      const result = (searchService as any).matchesTextSearch(toilet, 'park');
      expect(result).toBe(true);
    });

    it('should be case insensitive', () => {
      const toilet = { title: 'STATION TOILET', description: 'CLEAN AND MODERN' };
      const result = (searchService as any).matchesTextSearch(toilet, 'station');
      expect(result).toBe(true);
    });

    it('should return false for non-matching text', () => {
      const toilet = { title: 'Mall Toilet', description: 'Shopping center facility' };
      const result = (searchService as any).matchesTextSearch(toilet, 'station');
      expect(result).toBe(false);
    });
  });

  describe('distance calculation', () => {
    it('should calculate distance correctly', () => {
      const point1 = { latitude: 35.6762, longitude: 139.6503 };
      const point2 = { latitude: 35.6763, longitude: 139.6504 };

      const distance = (searchService as any).calculateDistance(point1, point2);
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(1); // Should be less than 1 km for nearby points
    });
  });

  describe('error handling', () => {
    it('should handle search errors gracefully', async () => {
      mockFirestore.collection().get.mockRejectedValue(new Error('Database error'));

      const filters: SearchFilters = {
        query: 'test',
        sortBy: SortOption.RELEVANCE,
      };

      const result = await searchService.searchToilets(filters);

      expect(result.toilets).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    it('should handle save search history errors', async () => {
      mockFirestore.collection().add.mockRejectedValue(new Error('Save error'));

      const userId = 'user-123';
      const filters: SearchFilters = {
        query: 'test',
        sortBy: SortOption.RELEVANCE,
      };

      // Should not throw error
      await expect(searchService.saveSearchHistory(userId, filters, 5)).resolves.not.toThrow();
    });
  });
});
