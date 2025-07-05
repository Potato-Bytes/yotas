import { create } from 'zustand';
import { User, Review, MapRegion } from '../types';

// Auth Store
interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>(set => ({
  user: null,
  isAuthenticated: false,
  setUser: user => set({ user, isAuthenticated: !!user }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));

// Map Store
interface MapStore {
  currentRegion: MapRegion;
  selectedPlace: unknown | null;
  nearbyPlaces: unknown[];
  setRegion: (region: MapRegion) => void;
  setSelectedPlace: (place: unknown | null) => void;
  setNearbyPlaces: (places: unknown[]) => void;
}

export const useMapStore = create<MapStore>(set => ({
  currentRegion: {
    latitude: 35.6762,
    longitude: 139.6503,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
  selectedPlace: null,
  nearbyPlaces: [],
  setRegion: region => set({ currentRegion: region }),
  setSelectedPlace: place => set({ selectedPlace: place }),
  setNearbyPlaces: places => set({ nearbyPlaces: places }),
}));

// Review Store
interface ReviewStore {
  reviews: Review[];
  isLoading: boolean;
  addReview: (review: Review) => void;
  setReviews: (reviews: Review[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useReviewStore = create<ReviewStore>(set => ({
  reviews: [],
  isLoading: false,
  addReview: review => set(state => ({ reviews: [review, ...state.reviews] })),
  setReviews: reviews => set({ reviews }),
  setLoading: loading => set({ isLoading: loading }),
}));
