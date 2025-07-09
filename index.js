/**
 * @format
 */

// import 'core-js/es/array/find-last-index'; // polyfill for Hermes - 一時的に無効化
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
