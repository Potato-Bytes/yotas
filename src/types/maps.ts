// 地図関連の型定義

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface ToiletLocation extends Coordinate {
  id: string;
  title: string;
  description?: string;
  type: ToiletType;
  isAccessible: boolean;
  rating?: number;
  reviewCount?: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  images?: string[];
  facilities?: {
    hasWashlet?: boolean;
    hasHandDryer?: boolean;
    hasBabyChanging?: boolean;
    hasMultiPurpose?: boolean;
    hasPaperTowels?: boolean;
    hasHandSoap?: boolean;
    hasVendingMachine?: boolean;
  };
  openingHours?: {
    is24Hours: boolean;
    openTime?: string;
    closeTime?: string;
    notes?: string;
  };
  additionalInfo?: string;
}

export enum ToiletType {
  PUBLIC = 'public', // 公共トイレ
  CONVENIENCE_STORE = 'convenience', // コンビニ
  STATION = 'station', // 駅
  PARK = 'park', // 公園
  SHOPPING_MALL = 'mall', // ショッピングモール
  RESTAURANT = 'restaurant', // レストラン・カフェ
  GAS_STATION = 'gas_station', // ガソリンスタンド
  OTHER = 'other', // その他
}

export interface ToiletMarkerProps {
  coordinate: Coordinate;
  toilet: ToiletLocation;
  onPress?: (toilet: ToiletLocation) => void;
}

export interface MapViewRef {
  animateToRegion: (region: MapRegion, duration?: number) => void;
  animateToCoordinate: (coordinate: Coordinate, duration?: number) => void;
  getMapBoundaries: () => Promise<{
    northEast: Coordinate;
    southWest: Coordinate;
  }>;
}

// 地図設定
export const DEFAULT_MAP_REGION: MapRegion = {
  latitude: 35.6762, // 東京駅
  longitude: 139.6503,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export const MAP_STYLE = {
  STANDARD: 'standard' as const,
  SATELLITE: 'satellite' as const,
  HYBRID: 'hybrid' as const,
  TERRAIN: 'terrain' as const,
};

export type MapStyleType = (typeof MAP_STYLE)[keyof typeof MAP_STYLE];
