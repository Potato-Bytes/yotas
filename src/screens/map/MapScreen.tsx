import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Map } from '../../components/Map';
import { useLocation } from '../../hooks/useLocation';
import { Region } from 'react-native-maps';

export default function MapScreen() {
  const { location, error } = useLocation();
  const [region, setRegion] = useState<Region | undefined>(undefined);

  useEffect(() => {
    // 初回起動時（regionが未設定）のみ現在地をセットする
    if (location && !region) {
      setRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    }
  }, [location, region]);

  // ユーザー操作でマップの表示領域が変更されたときに呼ばれる関数
  const handleRegionChangeComplete = (newRegion: Region) => {
    setRegion(newRegion);
  };

  if (error) {
    return (
      <View style={styles.container}>
        <Text>{error}</Text>
      </View>
    );
  }

  if (!region) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Map
        region={region}
        onRegionChangeComplete={handleRegionChangeComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});