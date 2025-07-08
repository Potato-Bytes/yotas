import { useLocationStore } from '../stores/locationStore';

// Zustandストアから状態を読み出すだけのシンプルなフック
export function useLocation() {
  const location = useLocationStore(state => state.location);
  const error = useLocationStore(state => state.error);
  const isLoading = useLocationStore(state => state.isLoading);

  return {
    location,
    error,
    isLoading
  };
}
