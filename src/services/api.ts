import { API_ENDPOINTS } from '../constants';

const API_BASE_URL = process.env.API_BASE_URL || 'https://api.yotas.com';

class ApiService {
  private baseURL: string;
  private authToken: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          headers[key] = value;
        }
      });
    }

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async login(credentials: { email: string; password: string }) {
    return this.request(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout() {
    return this.request(API_ENDPOINTS.AUTH.LOGOUT, {
      method: 'POST',
    });
  }

  // Review endpoints
  async getReviews(params?: { limit?: number; offset?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());

    const endpoint = `${API_ENDPOINTS.REVIEWS.LIST}?${searchParams}`;
    return this.request(endpoint);
  }

  async createReview(review: {
    placeId: string;
    rating: number;
    comment: string;
    photos?: string[];
  }) {
    return this.request(API_ENDPOINTS.REVIEWS.CREATE, {
      method: 'POST',
      body: JSON.stringify(review),
    });
  }

  async getReviewsByPlace(placeId: string) {
    const endpoint = API_ENDPOINTS.REVIEWS.BY_PLACE.replace(':placeId', placeId);
    return this.request(endpoint);
  }

  // Place endpoints
  async searchPlaces(query: string, location?: { lat: number; lng: number }) {
    const params = new URLSearchParams({ q: query });
    if (location) {
      params.append('lat', location.lat.toString());
      params.append('lng', location.lng.toString());
    }

    const endpoint = `${API_ENDPOINTS.PLACES.SEARCH}?${params}`;
    return this.request(endpoint);
  }

  async getNearbyPlaces(location: { lat: number; lng: number }, radius = 1000) {
    const params = new URLSearchParams({
      lat: location.lat.toString(),
      lng: location.lng.toString(),
      radius: radius.toString(),
    });

    const endpoint = `${API_ENDPOINTS.PLACES.NEARBY}?${params}`;
    return this.request(endpoint);
  }
}

export const apiService = new ApiService();
