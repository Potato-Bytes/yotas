import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithCredential, 
  signOut,
  GoogleAuthProvider,
  User as FirebaseUser
} from '@react-native-firebase/auth';
import { getApp } from '@react-native-firebase/app';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

class AuthService {
  private auth;

  constructor() {
    const app = getApp();
    this.auth = getAuth(app);
    this.configureGoogleSignIn();
  }

  private configureGoogleSignIn() {
    GoogleSignin.configure({
      webClientId: '787078900732-m6hflbubinifr6rn24gaqvisj15qmaae.apps.googleusercontent.com',
    });
  }

  /**
   * Googleサインインを実行
   */
  async signInWithGoogle(): Promise<User> {
    try {
      // Google サインイン画面を表示
      console.log('Checking Google Play Services...');
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      console.log('Starting Google Sign In...');
      const response = await GoogleSignin.signIn();
      console.log('Google Sign In response:', response);
      
      const idToken = response.data?.idToken || (response as { idToken?: string }).idToken;
      if (!idToken) {
        throw new Error('IDトークンの取得に失敗しました');
      }

      // Google認証情報を作成
      console.log('Creating Firebase credential...');
      const googleCredential = GoogleAuthProvider.credential(idToken);

      // Firebase にサインイン
      console.log('Signing in with Firebase...');
      const userCredential = await signInWithCredential(this.auth, googleCredential);

      return this.formatUser(userCredential.user);
    } catch (error: unknown) {
      console.error('Google sign in error:', error);
      
      const errorWithCode = error as { code?: string; message?: string };
      console.error('Error code:', errorWithCode.code);
      console.error('Error message:', errorWithCode.message);
      
      // エラーコード別の詳細メッセージ
      if (errorWithCode.code === 'statusCodes.SIGN_IN_CANCELLED') {
        throw new Error('サインインがキャンセルされました');
      } else if (errorWithCode.code === 'statusCodes.IN_PROGRESS') {
        throw new Error('サインインが進行中です');
      } else if (errorWithCode.code === 'statusCodes.PLAY_SERVICES_NOT_AVAILABLE') {
        throw new Error('Google Play Services が利用できません');
      } else {
        throw new Error(`Googleサインインに失敗しました: ${errorWithCode.message || 'Unknown error'}`);
      }
    }
  }

  /**
   * サインアウト
   */
  async signOut(): Promise<void> {
    try {
      // Firebase からサインアウト
      await signOut(this.auth);

      // Google からもサインアウト
      await GoogleSignin.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      throw new Error('サインアウトに失敗しました');
    }
  }

  /**
   * 認証状態変更の監視
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    try {
      return onAuthStateChanged(this.auth, firebaseUser => {
        try {
          if (firebaseUser) {
            callback(this.formatUser(firebaseUser));
          } else {
            callback(null);
          }
        } catch (error) {
          console.log('authService: onAuthStateChanged コールバックでエラー:', error);
          callback(null);
        }
      });
    } catch (error) {
      console.log('authService: onAuthStateChanged でエラー:', error);
      // ダミー関数を返す
      return () => {};
    }
  }

  /**
   * 現在のユーザーを取得
   */
  getCurrentUser(): User | null {
    try {
      const firebaseUser = this.auth.currentUser;
      return firebaseUser ? this.formatUser(firebaseUser) : null;
    } catch (error) {
      console.log('authService: getCurrentUser でエラー:', error);
      return null;
    }
  }

  /**
   * Firebase Userオブジェクトを標準形式に変換
   */
  private formatUser(firebaseUser: FirebaseUser): User {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
    };
  }

  /**
   * アカウント削除
   */
  async deleteAccount(): Promise<void> {
    try {
      const user = this.auth.currentUser;
      if (user) {
        await user.delete();
        await GoogleSignin.signOut();
      }
    } catch (error) {
      console.error('Delete account error:', error);
      throw new Error('アカウント削除に失敗しました');
    }
  }

  /**
   * ユーザーがサインインしているかチェック
   */
  isSignedIn(): boolean {
    return this.auth.currentUser !== null;
  }
}

export const authService = new AuthService();
