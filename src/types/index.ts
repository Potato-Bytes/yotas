// Review Types
export interface Review {
  id: string;
  userId: string;
  placeId: string;
  placeName: string;
  rating: number;
  comment: string;
  photos: string[];
  createdAt: Date;
  updatedAt: Date;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

// User Types
export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  reviews: Review[];
}

// Place Types
export interface Place {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  averageRating: number;
  totalReviews: number;
  category?: string;
}

// Map Types
export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}
