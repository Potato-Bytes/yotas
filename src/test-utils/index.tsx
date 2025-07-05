import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// カスタムレンダラー
interface CustomRenderOptions extends RenderOptions {
  initialRouteName?: string;
}

const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SafeAreaProvider>
    <NavigationContainer>{children}</NavigationContainer>
  </SafeAreaProvider>
);

const customRender = (ui: ReactElement, options?: CustomRenderOptions) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// re-export everything
export * from '@testing-library/react-native';

// override render method
export { customRender as render };

// テスト用のmockデータ
export const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: null,
};

export const mockToilet = {
  id: 'toilet-123',
  title: 'Test Toilet',
  type: 'public' as const,
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
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  authorId: 'author-123',
};

export const mockReport = {
  id: 'report-123',
  reporterId: mockUser.uid,
  targetType: 'toilet' as const,
  targetId: mockToilet.id,
  reason: 'inappropriate_content' as const,
  description: 'Test report description',
  status: 'pending' as const,
  createdAt: new Date('2024-01-01'),
};

// Navigation mock helpers
export const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  canGoBack: jest.fn(() => true),
  isFocused: jest.fn(() => true),
};

export const mockRoute = {
  key: 'test-route',
  name: 'TestScreen',
  params: {},
};

// 非同期処理のヘルパー
export const waitForAsync = (ms: number = 0) => new Promise(resolve => setTimeout(resolve, ms));

// Firestore mockデータ生成ヘルパー
export const createMockFirestoreDoc = (data: Record<string, unknown>) => ({
  id: data.id || 'mock-id',
  data: () => data,
  exists: true,
  ref: {
    update: jest.fn(() => Promise.resolve()),
    delete: jest.fn(() => Promise.resolve()),
  },
});

export const createMockFirestoreQuerySnapshot = (docs: Record<string, unknown>[]) => ({
  empty: docs.length === 0,
  size: docs.length,
  docs: docs.map(doc => createMockFirestoreDoc(doc)),
  forEach: (callback: (doc: Record<string, unknown>) => void) => {
    docs.forEach(doc => callback(createMockFirestoreDoc(doc)));
  },
});
