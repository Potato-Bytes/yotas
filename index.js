/**
 * @format
 */

// Core-js polyfills - 最初に読み込む
import 'core-js/features/array/find-last-index';
import 'core-js/features/array/find-last';
import 'core-js/features/object/has-own';
import 'core-js/features/string/at';

// React Native関連のインポート
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// グローバルエラーハンドリング（開発時のデバッグ用）
if (__DEV__) {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (
      args[0] &&
      typeof args[0] === 'string' &&
      args[0].includes('Non-serializable values were found')
    ) {
      // Navigation state警告を無視
      return;
    }
    originalConsoleError(...args);
  };
}

AppRegistry.registerComponent(appName, () => App);
