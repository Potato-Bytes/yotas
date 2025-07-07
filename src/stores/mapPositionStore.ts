import { create } from 'zustand';
import { MapRegion } from '../types/maps';

// シンプルなメモリベースの位置管理（永続化なし）
interface MapPositionState {
  currentMapPosition: MapRegion | null;
  setCurrentMapPosition: (region: MapRegion) => void;
  clearCurrentMapPosition: () => void;
  hasValidPosition: () => boolean;
}

// 日本国内の座標かチェック
const isValidJapaneseCoordinate = (region: MapRegion): boolean => {
  // 日本の大まかな範囲：北海道から沖縄まで
  const isInJapan = 
    region.latitude >= 24 && region.latitude <= 46 &&  // 緯度：沖縄から北海道
    region.longitude >= 123 && region.longitude <= 146; // 経度：西端から東端
  
  // 基本的な有効性チェック
  const isValidBasic = 
    typeof region.latitude === 'number' &&
    typeof region.longitude === 'number' &&
    typeof region.latitudeDelta === 'number' &&
    typeof region.longitudeDelta === 'number' &&
    !isNaN(region.latitude) &&
    !isNaN(region.longitude) &&
    !isNaN(region.latitudeDelta) &&
    !isNaN(region.longitudeDelta) &&
    region.latitudeDelta > 0 &&
    region.longitudeDelta > 0;

  return isValidBasic && isInJapan;
};

export const useMapPositionStore = create<MapPositionState>((set, get) => ({
  currentMapPosition: null,
  
  setCurrentMapPosition: (region: MapRegion) => {
    if (isValidJapaneseCoordinate(region)) {
      console.log('有効な日本国内の位置を保存:', region);
      set({ currentMapPosition: region });
    } else {
      console.warn('無効または日本国外の座標のため保存をスキップ:', region);
    }
  },
  
  clearCurrentMapPosition: () => {
    console.log('位置データをクリア');
    set({ currentMapPosition: null });
  },
  
  hasValidPosition: () => {
    const position = get().currentMapPosition;
    return position !== null && isValidJapaneseCoordinate(position);
  },
}));