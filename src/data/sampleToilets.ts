import { ToiletLocation, ToiletType } from '../types/maps';

// サンプルのトイレデータ（東京駅周辺）
export const sampleToilets: ToiletLocation[] = [
  {
    id: '1',
    title: '東京駅構内トイレ',
    description: '東京駅丸の内口近くの清潔なトイレです。',
    latitude: 35.6812,
    longitude: 139.7671,
    type: ToiletType.STATION,
    isAccessible: true,
    rating: 4.5,
    reviewCount: 23,
    createdBy: 'user1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    title: 'セブンイレブン大手町店',
    description: 'いつでも利用可能なコンビニのトイレです。',
    latitude: 35.6847,
    longitude: 139.7653,
    type: ToiletType.CONVENIENCE_STORE,
    isAccessible: false,
    rating: 4.0,
    reviewCount: 12,
    createdBy: 'user2',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: '3',
    title: '皇居東御苑トイレ',
    description: '皇居東御苑内の公共トイレ。環境が良く清潔です。',
    latitude: 35.6838,
    longitude: 139.7544,
    type: ToiletType.PARK,
    isAccessible: true,
    rating: 4.2,
    reviewCount: 8,
    createdBy: 'user3',
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-25'),
  },
  {
    id: '4',
    title: '丸の内ビルディング',
    description: 'ショッピングモール内の高級感あるトイレです。',
    latitude: 35.6795,
    longitude: 139.7638,
    type: ToiletType.SHOPPING_MALL,
    isAccessible: true,
    rating: 4.8,
    reviewCount: 35,
    createdBy: 'user4',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
  {
    id: '5',
    title: 'スターバックス有楽町店',
    description: 'カフェ内のトイレ。購入者のみ利用可能です。',
    latitude: 35.6751,
    longitude: 139.7648,
    type: ToiletType.RESTAURANT,
    isAccessible: false,
    rating: 4.3,
    reviewCount: 19,
    createdBy: 'user5',
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date('2024-02-05'),
  },
  {
    id: '6',
    title: '日比谷公園トイレ',
    description: '日比谷公園内の公共トイレ。広くて使いやすいです。',
    latitude: 35.6733,
    longitude: 139.7591,
    type: ToiletType.PARK,
    isAccessible: true,
    rating: 3.9,
    reviewCount: 14,
    createdBy: 'user6',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10'),
  },
  {
    id: '7',
    title: '銀座駅トイレ',
    description: '銀座駅構内の清潔なトイレです。',
    latitude: 35.6719,
    longitude: 139.7658,
    type: ToiletType.STATION,
    isAccessible: true,
    rating: 4.1,
    reviewCount: 27,
    createdBy: 'user7',
    createdAt: new Date('2024-02-12'),
    updatedAt: new Date('2024-02-12'),
  },
  {
    id: '8',
    title: 'ファミリーマート新橋店',
    description: '新橋駅近くのコンビニトイレです。',
    latitude: 35.6663,
    longitude: 139.7584,
    type: ToiletType.CONVENIENCE_STORE,
    isAccessible: false,
    rating: 3.7,
    reviewCount: 9,
    createdBy: 'user8',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15'),
  },
  {
    id: '9',
    title: 'KITTE公共トイレ',
    description: 'KITTEビル内の美しいトイレです。',
    latitude: 35.6813,
    longitude: 139.764,
    type: ToiletType.SHOPPING_MALL,
    isAccessible: true,
    rating: 4.6,
    reviewCount: 42,
    createdBy: 'user9',
    createdAt: new Date('2024-02-18'),
    updatedAt: new Date('2024-02-18'),
  },
  {
    id: '10',
    title: '大手町公園トイレ',
    description: '大手町の小さな公園内のトイレです。',
    latitude: 35.6889,
    longitude: 139.7669,
    type: ToiletType.PARK,
    isAccessible: false,
    rating: 3.5,
    reviewCount: 6,
    createdBy: 'user10',
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-02-20'),
  },
];

// 近くのトイレを検索する関数
export const getNearbyToilets = (
  centerLat: number,
  centerLng: number,
  radiusKm: number = 2,
): ToiletLocation[] =>
  sampleToilets.filter(toilet => {
    const distance = calculateDistance(
      { latitude: centerLat, longitude: centerLng },
      { latitude: toilet.latitude, longitude: toilet.longitude },
    );
    return distance <= radiusKm * 1000; // メートルに変換
  });

// 距離計算関数（ハーバーサイン公式）
const calculateDistance = (
  coord1: { latitude: number; longitude: number },
  coord2: { latitude: number; longitude: number },
): number => {
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
