/**
 * @format
 */

// Polyfillsは他のimportより前に配置
import 'core-js/features/array/find-last-index';
import 'core-js/features/array/find-last';
import 'core-js/features/object/has-own';
import 'core-js/features/string/at';

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
