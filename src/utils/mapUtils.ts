import { Coordinate, MapRegion, ToiletType } from '../types/maps';

/**
 * 2点間の距離を計算（ハーバーサイン公式）
 * @param coord1 座標1
 * @param coord2 座標2
 * @returns 距離（メートル）
 */
export const calculateDistance = (coord1: Coordinate, coord2: Coordinate): number => {
  const R = 6371e3; // 地球の半径（メートル）
  const φ1 = (coord1.latitude * Math.PI) / 180;
  const φ2 = (coord2.latitude * Math.PI) / 180;
  const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * 距離を読みやすい形式にフォーマット
 * @param distance 距離（メートル）
 * @returns フォーマットされた距離文字列
 */
export const formatDistance = (distance: number): string => {
  if (distance < 1000) {
    return `${Math.round(distance)}m`;
  } else {
    return `${(distance / 1000).toFixed(1)}km`;
  }
};

/**
 * 座標配列から地図の境界を計算
 * @param coordinates 座標配列
 * @param padding パディング（度）
 * @returns マップリージョン
 */
export const calculateMapRegion = (
  coordinates: Coordinate[],
  padding: number = 0.01,
): MapRegion => {
  if (coordinates.length === 0) {
    return {
      latitude: 35.6762,
      longitude: 139.6503,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  if (coordinates.length === 1) {
    return {
      latitude: coordinates[0].latitude,
      longitude: coordinates[0].longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  const latitudes = coordinates.map(coord => coord.latitude);
  const longitudes = coordinates.map(coord => coord.longitude);

  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  const latDelta = Math.max(maxLat - minLat + padding, 0.01);
  const lngDelta = Math.max(maxLng - minLng + padding, 0.01);

  return {
    latitude: centerLat,
    longitude: centerLng,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
};

/**
 * トイレタイプに対応するアイコンを取得
 * @param type トイレタイプ
 * @returns アイコン文字列
 */
export const getToiletIcon = (type: ToiletType | string): string => {
  // string型の場合はToiletTypeに変換
  const normalizedType = typeof type === 'string' ? type.toLowerCase() : type;
  
  switch (normalizedType) {
    case ToiletType.PUBLIC:
    case 'public':
      return '🚻';
    case ToiletType.CONVENIENCE_STORE:
    case 'convenience':
    case 'convenience_store':
      return '🏪';
    case ToiletType.STATION:
    case 'station':
      return '🚉';
    case ToiletType.PARK:
    case 'park':
      return '🌳';
    case ToiletType.SHOPPING_MALL:
    case 'mall':
    case 'shopping_mall':
      return '🏬';
    case ToiletType.RESTAURANT:
    case 'restaurant':
      return '🍽️';
    case ToiletType.GAS_STATION:
    case 'gas_station':
      return '⛽';
    case ToiletType.OTHER:
    case 'other':
    default:
      return '🚽';
  }
};

/**
 * トイレタイプの日本語名を取得
 * @param type トイレタイプ
 * @returns 日本語名
 */
export const getToiletTypeName = (type: ToiletType): string => {
  switch (type) {
    case ToiletType.PUBLIC:
      return '公共トイレ';
    case ToiletType.CONVENIENCE_STORE:
      return 'コンビニ';
    case ToiletType.STATION:
      return '駅';
    case ToiletType.PARK:
      return '公園';
    case ToiletType.SHOPPING_MALL:
      return 'ショッピングモール';
    case ToiletType.RESTAURANT:
      return 'レストラン・カフェ';
    case ToiletType.GAS_STATION:
      return 'ガソリンスタンド';
    case ToiletType.OTHER:
    default:
      return 'その他';
  }
};

/**
 * トイレタイプのカラーコードを取得
 * @param type トイレタイプ
 * @returns カラーコード
 */
export const getToiletTypeColor = (type: ToiletType | string): string => {
  // string型の場合はToiletTypeに変換
  const normalizedType = typeof type === 'string' ? type.toLowerCase() : type;
  
  switch (normalizedType) {
    case ToiletType.PUBLIC:
    case 'public':
      return '#4CAF50';
    case ToiletType.CONVENIENCE_STORE:
    case 'convenience':
    case 'convenience_store':
      return '#FF9800';
    case ToiletType.STATION:
    case 'station':
      return '#2196F3';
    case ToiletType.PARK:
    case 'park':
      return '#8BC34A';
    case ToiletType.SHOPPING_MALL:
    case 'mall':
    case 'shopping_mall':
      return '#9C27B0';
    case ToiletType.RESTAURANT:
    case 'restaurant':
      return '#FF5722';
    case ToiletType.GAS_STATION:
    case 'gas_station':
      return '#795548';
    case ToiletType.OTHER:
    case 'other':
    default:
      return '#607D8B';
  }
};

/**
 * 座標が有効かチェック
 * @param coordinate 座標
 * @returns 有効かどうか
 */
export const isValidCoordinate = (coordinate: Coordinate): boolean =>
  coordinate &&
  typeof coordinate.latitude === 'number' &&
  typeof coordinate.longitude === 'number' &&
  coordinate.latitude >= -90 &&
  coordinate.latitude <= 90 &&
  coordinate.longitude >= -180 &&
  coordinate.longitude <= 180 &&
  !isNaN(coordinate.latitude) &&
  !isNaN(coordinate.longitude);

/**
 * 地図の中心から指定した距離内にある座標をフィルタリング
 * @param center 中心座標
 * @param coordinates 座標配列
 * @param maxDistance 最大距離（メートル）
 * @returns フィルタリングされた座標配列
 */
export const filterCoordinatesByDistance = (
  center: Coordinate,
  coordinates: Coordinate[],
  maxDistance: number,
): Coordinate[] =>
  coordinates.filter(coord => {
    const distance = calculateDistance(center, coord);
    return distance <= maxDistance;
  });
