import { create } from 'zustand';
import { Region } from 'react-native-maps';

interface MapState {
  lastRegion: Region | null;
  setLastRegion: (r: Region) => void;
  clear: () => void;
}

export const useMapStore = create<MapState>(set => ({
  lastRegion: null,
  setLastRegion: r => set({ lastRegion: r }),
  clear: () => set({ lastRegion: null }),
}));