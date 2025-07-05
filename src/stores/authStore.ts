import { create } from 'zustand';
import { authService, User } from '../services/authService';

interface AuthState {
  // 状態
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // アクション
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  clearError: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // 初期状態
  user: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  // Googleサインイン
  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.signInWithGoogle();
      set({ user, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'サインインに失敗しました',
        isLoading: false,
      });
    }
  },

  // サインアウト
  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      await authService.signOut();
      set({ user: null, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'サインアウトに失敗しました',
        isLoading: false,
      });
    }
  },

  // アカウント削除
  deleteAccount: async () => {
    set({ isLoading: true, error: null });
    try {
      await authService.deleteAccount();
      set({ user: null, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'アカウント削除に失敗しました',
        isLoading: false,
      });
    }
  },

  // エラークリア
  clearError: () => {
    set({ error: null });
  },

  // 認証状態の初期化
  initialize: () => {
    try {
      console.log('authStore: 初期化開始');
      // 現在のユーザーを設定（エラーハンドリング付き）
      let currentUser = null;
      try {
        currentUser = authService.getCurrentUser();
      } catch (error) {
        console.log('authStore: getCurrentUser でエラー（スキップ）:', error);
      }
      
      set({ user: currentUser, isInitialized: true });
      console.log('authStore: 初期化完了', { user: currentUser });

      // 認証状態変更の監視を開始（エラーハンドリング付き）
      try {
        authService.onAuthStateChanged(user => {
          console.log('authStore: 認証状態変更:', user);
          set({ user });
        });
      } catch (error) {
        console.log('authStore: onAuthStateChanged でエラー（スキップ）:', error);
      }
    } catch (error) {
      console.error('authStore: 初期化でエラー:', error);
      // エラーが発生しても初期化完了とする
      set({ user: null, isInitialized: true });
    }
  },
}));

// 認証状態の便利なセレクター
export const useAuth = () => {
  const { user, isLoading, error, isInitialized } = useAuthStore();
  return {
    user,
    isLoading: !isInitialized || isLoading, // 初期化中もローディング扱い
    error,
    isAuthenticated: !!user,
  };
};

export const useAuthActions = () => {
  const { signInWithGoogle, signOut, deleteAccount, clearError } = useAuthStore();
  return {
    signInWithGoogle,
    signOut,
    deleteAccount,
    clearError,
  };
};
