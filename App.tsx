/**
 * yotas - Location-based Review App
 * @format
 */

import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppNavigator from './src/navigation/AppNavigator';
import { useLocationStore } from './src/stores/locationStore';

const queryClient = new QueryClient();

function App() {
  console.log('App: レンダリング中');
  const isDarkMode = useColorScheme() === 'dark';
  const initializeLocation = useLocationStore(state => state.initializeLocation);

  // アプリ起動時に一度だけ位置情報を初期化
  useEffect(() => {
    console.log('App: 位置情報の初期化開始');
    initializeLocation();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <View style={styles.container}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <AppNavigator />
      </View>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;