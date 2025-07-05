import { renderHook, act } from '@testing-library/react-native';
import { useReport } from '../useReport';

// Mock the auth store
jest.mock('../../stores/authStore', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-123' }
  })
}));

// Mock the report service
jest.mock('../../services/reportService', () => ({
  reportService: {
    submitReport: jest.fn(() => Promise.resolve()),
    getUserReports: jest.fn(() => Promise.resolve([])),
    getUserRestrictions: jest.fn(() => Promise.resolve([])),
    getUserViolationPoints: jest.fn(() => Promise.resolve(0)),
    isUserRestricted: jest.fn(() => Promise.resolve({ restricted: false })),
  }
}));

describe('useReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useReport());

    expect(result.current.reports).toEqual([]);
    expect(result.current.userRestrictions).toEqual([]);
    expect(result.current.violationPoints).toBe(0);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should have submitReport function', () => {
    const { result } = renderHook(() => useReport());

    expect(typeof result.current.submitReport).toBe('function');
  });

  it('should have display name functions', () => {
    const { result } = renderHook(() => useReport());

    expect(typeof result.current.getReasonDisplayName).toBe('function');
    expect(typeof result.current.getStatusDisplayName).toBe('function');
    expect(typeof result.current.getStatusColor).toBe('function');
  });

  it('should have utility functions', () => {
    const { result } = renderHook(() => useReport());

    expect(typeof result.current.hasActiveRestrictions).toBe('function');
    expect(typeof result.current.getActiveRestrictionTypes).toBe('function');
    expect(typeof result.current.isNearViolationLimit).toBe('function');
    expect(typeof result.current.refresh).toBe('function');
  });

  it('should handle reason display names', () => {
    const { result } = renderHook(() => useReport());

    const displayName = result.current.getReasonDisplayName('inappropriate_content');
    expect(typeof displayName).toBe('string');
  });

  it('should handle status display names', () => {
    const { result } = renderHook(() => useReport());

    const displayName = result.current.getStatusDisplayName('pending' as any);
    expect(typeof displayName).toBe('string');
  });

  it('should handle status colors', () => {
    const { result } = renderHook(() => useReport());

    const color = result.current.getStatusColor('pending' as any);
    expect(typeof color).toBe('string');
  });
});