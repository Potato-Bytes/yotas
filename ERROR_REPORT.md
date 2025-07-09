# yotas MapScreen Gray Screen Error Report

## 問題の概要

**現象**: アプリ起動時に画面がグレーのまま動作しない
**発生日時**: 2025-07-09
**影響度**: 🔴 Critical - アプリが完全に使用不可能

## 技術的詳細

### 環境情報
- React Native: 0.80.1
- react-native-maps: 1.24.x
- react-native-geolocation-service: 5.4.x
- プラットフォーム: Android実機テスト
- 他のアプリ（Google Maps等）は正常動作

### 実行した修正内容

#### 1. MapView Controlled Component化
```typescript
// 修正前: displayRegion計算による表示制御
const displayRegion = useMemo(() => {
  if (location) return gpsRegion;
  return DEFAULT_REGION;
}, [location]);

// 修正後: region stateによる完全制御
const [region, setRegion] = useState<Region | null>(null);
useEffect(() => {
  if (!region && location) {
    setRegion(initialRegion);
  }
}, [location, region]);
```

#### 2. 条件付きレンダリング
```typescript
// 位置情報が取得できるまでMapを表示しない
{region && (
  <Map
    ref={mapRef}
    region={region}
    onSafeReady={handleMapReady}
    showUserMarker={!!location}
    onRegionChangeComplete={handleRegionChangeComplete}
  />
)}
```

#### 3. onLayout Fallback実装
```typescript
// Map.tsx内でonMapReadyとonLayoutの両方を使用
const fireReady = useCallback(() => {
  if (!ready) {
    setReady(true);
    onSafeReady?.();
  }
}, [ready, onSafeReady]);

return (
  <MapView
    onMapReady={fireReady}
    onLayout={fireReady}
    {...rest}
  />
);
```

#### 4. Core-js Polyfill追加
```javascript
// index.js
import 'core-js/es/array/find-last-index'; // polyfill for Hermes
```

### 推測される原因

1. **位置情報取得の遅延/失敗**
   - `useLocationStore`の`initializeLocation()`が実行されていない
   - 位置情報権限の問題
   - `region`が`null`のため`{region && ...}`条件でMapが表示されない

2. **MapView初期化の問題**
   - react-native-mapsの設定問題
   - Google Maps API keyの問題
   - onSafeReadyコールバックが呼ばれない

3. **State管理の問題**
   - `region`状態が正しく更新されない
   - useEffectの依存関係の問題

### デバッグ情報

現在、以下のデバッグ情報を画面左上に表示：
```typescript
<View style={styles.debugInfo}>
  <Text>region: {region ? 'あり' : 'なし'}</Text>
  <Text>location: {location ? 'あり' : 'なし'}</Text>
  <Text>isLoading: {isLoading ? 'true' : 'false'}</Text>
  <Text>errorMsg: {errorMsg || 'なし'}</Text>
</View>
```

### 確認が必要な項目

1. **位置情報ストアの動作確認**
   - `App.tsx`で`initializeLocation()`が実行されているか
   - 位置情報権限が正しく取得されているか
   - `watchPosition`が正常に動作しているか

2. **MapView自体の動作確認**
   - Google Maps API keyが正しく設定されているか
   - `onSafeReady`コールバックが呼ばれているか
   - `region || DEFAULT_REGION`で最低限の表示ができるか

3. **Metro bundlerの状態**
   - サーバーが正常に起動しているか
   - エラーログが出力されていないか

## 次のステップ

1. 実機でデバッグ情報を確認
2. Metro bundlerのログを確認
3. 位置情報権限の状態を確認
4. 必要に応じて条件分岐を緩和

## 関連ファイル

- `src/screens/map/MapScreen.tsx` - メインの問題箇所
- `src/components/Map.tsx` - MapViewラッパー
- `src/stores/locationStore.ts` - 位置情報管理
- `App.tsx` - アプリ初期化
- `index.js` - エントリーポイント

## コミット履歴

- `b5d4ec4`: debug: add temporary debug info and controlled MapView implementation
- `36b1037`: fix(map): use onLayout fallback to guarantee mapReady; resolve world-map display issue