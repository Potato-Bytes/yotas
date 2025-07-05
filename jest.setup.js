// React Native Testing Library setup
// Note: extend-expect is included by default in newer versions

// Firebase mocksを追加
jest.mock('@react-native-firebase/app', () => ({
  utils: () => ({
    FilePath: {
      PICTURES_DIRECTORY: '/tmp/pictures',
    },
  }),
}));

// Mock Firestore with proper Timestamp support
const mockFirestoreDoc = () => ({
  set: jest.fn(() => Promise.resolve()),
  get: jest.fn(() => Promise.resolve({ exists: false, data: () => ({}) })),
  update: jest.fn(() => Promise.resolve()),
  delete: jest.fn(() => Promise.resolve()),
  id: 'mock-doc-id',
});

const mockFirestoreQuery = () => ({
  get: jest.fn(() => Promise.resolve({ empty: true, docs: [] })),
  where: jest.fn(() => mockFirestoreQuery()),
  orderBy: jest.fn(() => mockFirestoreQuery()),
  limit: jest.fn(() => mockFirestoreQuery()),
});

const mockFirestoreCollection = () => ({
  doc: jest.fn(() => mockFirestoreDoc()),
  add: jest.fn(() => Promise.resolve({ id: 'mock-id' })),
  where: jest.fn(() => mockFirestoreQuery()),
  orderBy: jest.fn(() => mockFirestoreQuery()),
  limit: jest.fn(() => mockFirestoreQuery()),
  get: jest.fn(() => Promise.resolve({ empty: true, docs: [] })),
});

const mockFirestore = () => ({
  collection: jest.fn(() => mockFirestoreCollection()),
  batch: jest.fn(() => ({
    delete: jest.fn(),
    commit: jest.fn(() => Promise.resolve()),
  })),
});

// Add Timestamp mock
mockFirestore.Timestamp = {
  now: jest.fn(() => ({ seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 })),
  fromDate: jest.fn((date) => ({ seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 })),
  fromMillis: jest.fn((millis) => ({ seconds: Math.floor(millis / 1000), nanoseconds: 0 })),
};

jest.mock('@react-native-firebase/firestore', () => ({
  __esModule: true,
  default: mockFirestore,
}));

jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    currentUser: null,
    signInWithEmailAndPassword: jest.fn(() => Promise.resolve()),
    createUserWithEmailAndPassword: jest.fn(() => Promise.resolve()),
    signOut: jest.fn(() => Promise.resolve()),
  })),
}));

jest.mock('@react-native-firebase/storage', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    ref: jest.fn(() => ({
      putFile: jest.fn(() => Promise.resolve()),
      getDownloadURL: jest.fn(() => Promise.resolve('https://example.com/image.jpg')),
    })),
  })),
}));

// React Navigation mocks
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  NavigationContainer: ({ children }) => children,
}));

// SafeAreaProvider mock
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// React Native Vector Icons mock
jest.mock('react-native-vector-icons/Ionicons', () => {
   
  const React = require('react');
   
  const { Text } = require('react-native');
  
  const Icon = ({ name, ...props }) => React.createElement(Text, { ...props }, `Icon-${name}`);
  return Icon;
});

// React Native Async Storage mock
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Alert mock - simple approach
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
  prompt: jest.fn(),
}));

// Modal mock - React Native Modal doesn't render children in tests by default
jest.mock('react-native/Libraries/Modal/Modal', () => {
  const mockModal = ({ children, visible }) => {
    if (visible) {
      return children;
    }
    return null;
  };
  return mockModal;
});

// Mock react-native-maps
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  const MockMapView = (props) => React.createElement(View, props, props.children);
  const MockMarker = (props) => React.createElement(View, props, props.children);
  const MockPolyline = (props) => React.createElement(View, props);
  const MockPolygon = (props) => React.createElement(View, props);
  const MockCircle = (props) => React.createElement(View, props);
  
  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
    Polyline: MockPolyline,
    Polygon: MockPolygon,
    Circle: MockCircle,
    PROVIDER_GOOGLE: 'google',
    PROVIDER_DEFAULT: 'default',
  };
});

// Mock native modules that don't exist in test environment
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => ({
  getEnforcing: jest.fn(() => ({})),
  get: jest.fn(() => ({})),
}));

// Console warning suppression for tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};