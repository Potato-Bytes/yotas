import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { NavigationState } from '@react-navigation/native';
// import Icon from 'react-native-vector-icons/Ionicons';

// Import screens (placeholders for now)
import MapScreen from '../screens/map/MapScreen';
import PostReviewScreen from '../screens/post/PostReviewScreen';
import HistoryScreen from '../screens/history/HistoryScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import LoginScreen from '../screens/auth/LoginScreen';

// Import auth store
import { useAuth, useAuthStore } from '../stores/authStore';

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Map: undefined;
  Post: undefined;
  History: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// ナビゲーション状態のログ関数
const onStateChange = (state: NavigationState | undefined) => {
  if (state) {
    const currentRoute = state.routes[state.index];
    if (currentRoute.state) {
      const tabState = currentRoute.state as NavigationState;
      const currentTab = tabState.routes[tabState.index];
      console.log('=== ナビゲーション変更 ===');
      console.log('現在のタブ:', currentTab.name);
    }
  }
};

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, size }) => {
        let icon: string;

        if (route.name === 'Map') {
          icon = focused ? '🗺️' : '🗺️';
        } else if (route.name === 'Post') {
          icon = focused ? '✏️' : '✏️';
        } else if (route.name === 'History') {
          icon = focused ? '📝' : '📝';
        } else if (route.name === 'Settings') {
          icon = focused ? '⚙️' : '⚙️';
        } else {
          icon = '❓';
        }

        return <View style={{justifyContent: 'center', alignItems: 'center'}}><Text style={{fontSize: size * 0.8, opacity: focused ? 1 : 0.5}}>{icon}</Text></View>;
      },
      tabBarActiveTintColor: '#007AFF',
      tabBarInactiveTintColor: 'gray',
      unmountOnBlur: false, // タブ切り替え時も状態を保持
    })}
  >
    <Tab.Screen name="Map" component={MapScreen} options={{ title: 'マップ' }} />
    <Tab.Screen name="Post" component={PostReviewScreen} options={{ title: '投稿' }} />
    <Tab.Screen name="History" component={HistoryScreen} options={{ title: '履歴' }} />
    <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: '設定' }} />
  </Tab.Navigator>
);

const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const initialize = useAuthStore(state => state.initialize);

  // アプリ起動時に認証状態を初期化
  useEffect(() => {
    try {
      initialize();
    } catch (error) {
      console.error('AppNavigator: 初期化でエラー:', error);
    }
  }, [initialize]);

  // 認証状態の確認中はローディング画面を表示
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285f4" />
      </View>
    );
  }

  return (
    <NavigationContainer onStateChange={onStateChange}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <Stack.Screen name="Auth" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default AppNavigator;
