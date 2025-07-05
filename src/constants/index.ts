// Map Constants
export const DEFAULT_MAP_REGION = {
  latitude: 35.6762,
  longitude: 139.6503,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

// API Constants
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },
  REVIEWS: {
    LIST: '/reviews',
    CREATE: '/reviews',
    UPDATE: '/reviews/:id',
    DELETE: '/reviews/:id',
    BY_PLACE: '/reviews/place/:placeId',
  },
  PLACES: {
    SEARCH: '/places/search',
    DETAILS: '/places/:id',
    NEARBY: '/places/nearby',
  },
};

// Rating Constants
export const RATING_COLORS = {
  1: '#FF0000',
  2: '#FF7F00',
  3: '#FFFF00',
  4: '#7FFF00',
  5: '#00FF00',
};

// UI Constants
export const COLORS = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#4CD964',
  warning: '#FF9500',
  danger: '#FF3B30',
  info: '#5AC8FA',
  light: '#F2F2F7',
  dark: '#1C1C1E',
  background: '#FFFFFF',
  text: '#000000',
  textSecondary: '#8E8E93',
  border: '#C7C7CC',
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@yotas_auth_token',
  USER_DATA: '@yotas_user_data',
  RECENT_SEARCHES: '@yotas_recent_searches',
  MAP_PREFERENCES: '@yotas_map_preferences',
};
