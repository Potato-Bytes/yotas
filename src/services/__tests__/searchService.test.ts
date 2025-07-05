import { SearchService } from '../searchService';

describe('SearchService', () => {
  let searchService: SearchService;

  beforeEach(() => {
    searchService = new SearchService();
    jest.clearAllMocks();
  });

  describe('searchToilets', () => {
    it('should search toilets with filters', async () => {
      const filters = {
        keyword: 'test',
        accessibility: true,
        facilities: ['washlet'],
        rating: 4,
        distance: 1000,
      };

      const result = await searchService.searchToilets(filters);

      expect(result).toBeDefined();
      expect(result.toilets).toBeDefined();
      expect(Array.isArray(result.toilets)).toBe(true);
    });

    it('should search without user location', async () => {
      const filters = {
        keyword: 'station',
      };

      const result = await searchService.searchToilets(filters);

      expect(result).toBeDefined();
      expect(Array.isArray(result.toilets)).toBe(true);
    });
  });

  describe('getSavedSearches', () => {
    it('should retrieve saved searches', async () => {
      const userId = 'user-123';

      const searches = await searchService.getSavedSearches(userId);

      expect(Array.isArray(searches)).toBe(true);
    });
  });

  describe('getSearchHistory', () => {
    it('should retrieve search history', async () => {
      const userId = 'user-123';

      const history = await searchService.getSearchHistory(userId);

      expect(Array.isArray(history)).toBe(true);
    });
  });
});