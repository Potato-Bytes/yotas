# フェーズ A ― 現在地 UI 完全実装・指示書
**目的**  
* ログイン直後の Map 画面で **ユーザーの現在地をリアルタイム表示** し、  
  追従ボタン (FAB) でワンタップ復帰できるようにする。  
* 権限未許可・GPS OFF 時の UX も網羅する。  

---

## 🎯 実装進捗状況

| タスク | ステータス | 完了日時 | 備考 |
|-------|---------|---------|------|
| 1. watchPosition の導入 | ✅ 完了 | 2025-07-09 14:05 | 実機テストで位置情報更新を確認 |
| 2. 現在地マーカーを描画 | 🔲 未着手 | - | - |
| 3. FAB 追加 | 🔲 未着手 | - | - |
| 4. 権限・GPS エラー UX | 🔲 未着手 | - | - |

### 実機テスト結果（Phase A-1）
- ✅ watchPositionによるリアルタイム位置情報更新が成功
- ✅ 約8秒間隔で位置情報が更新されることを確認
- ✅ MapScreenで現在地表示が正常動作
- ✅ PostReviewScreenでも位置情報を取得
- ✅ メモリリーク防止のためのstop()実装済み

---

## 0. 事前情報
* ライブラリ  
  * `react-native-geolocation-service` 5.4.x  
  * `react-native-maps` 1.24.x  
  * （UI）`react-native-paper` 5.x（未導入なら `npm i react-native-paper`）  
* 対象ファイル構成（抜粋）  
```
src/
├── stores/locationStore.ts
├── components/Map/
│   └── Map.tsx
├── screens/map/MapScreen.tsx
└── assets/icons/
```

---

## 1. watchPosition の導入
### 1‑1. 位置情報ストアの拡張
**ファイル** `src/stores/locationStore.ts`

| 手順 | 詳細 | 参考 Diff |
|------|------|----------|
| 1 | `watchId: number | null` を State に追加 | `watchId: null,` |
| 2 | `initializeLocation()` 内で **watchPosition** を開始し、返却された ID を `watchId` に保持 | ```ts
const id = Geolocation.watchPosition(
  (pos) => set({ location: { latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy } }),
  (err) => set({ errorMsg: err.message }),
  { enableHighAccuracy: true, distanceFilter: 20, interval: 4000 }
);
set({ watchId: id, isLoading: false });
``` |
| 3 | **`stop` アクション**を追加し、`watchId` をクリア | ```ts
stop: () => {
  const id = get().watchId;
  if (id !== null) Geolocation.clearWatch(id);
  set({ watchId: null });
},
``` |
| 4 | `reset` 内でも `stop()` を呼び出す |  |

> 📝 **注意**: Android は `distanceFilter` か `interval` を指定しないとハイフリークエンシーでバッテリーを消費します。

### 1‑2. メモリリーク防止
`App.tsx` の `useEffect` に **アンマウント時の `stop()`** を追加
```ts
useEffect(() => {
  const { initializeLocation, stop } = useLocationStore.getState();
  initializeLocation();
  return () => stop();
}, []);
```

---

## 2. 現在地マーカーを描画

### 2‑1. アイコン準備

* `assets/icons/current_location.png`（24×24 px, 青点など）を追加。

### 2‑2. コンポーネント改修

**ファイル** `components/Map/Map.tsx`

1. `react-native-maps` から `Marker` を import
2. `props.region` が存在し `showUserMarker` が true のとき Marker を描画

   ```tsx
   {showUserMarker && (
     <Marker
       coordinate={{ latitude: region.latitude, longitude: region.longitude }}
       anchor={{ x: 0.5, y: 0.5 }}
       image={require('../../assets/icons/current_location.png')}
     />
   )}
   ```
3. `MapScreen` から `<Map showUserMarker={!!location} ... />` を渡す

---

## 3. 「現在地へ戻る」FAB 追加

### 3‑1. パッケージ

```bash
npm i react-native-paper
```

（RN 0.80 では autolinking 済 ― iOS で Pod 再インストールが不要なことを確認）

### 3‑2. UI 実装

**`MapScreen.tsx`** 末尾に `<FAB>` を配置

```tsx
import { FAB } from 'react-native-paper';

<FAB
  icon="crosshairs-gps"
  style={styles.fab}
  onPress={moveToCurrentLocation}
  disabled={!location}
/>
```

```ts
fab: {
  position: 'absolute',
  bottom: 40,
  right: 20,
},
```

---

## 4. 権限・GPS エラー UX

### 4‑1. パーミッションなし

* `errorMsg === '位置情報の権限がありません。'` のとき
  `Button` 「設定を開く」→ `Linking.openSettings()` を実行。

### 4‑2. 位置情報 OFF

* `error.code === 2` (`POSITION_UNAVAILABLE`) を検知し
  Toast で「端末の位置情報を ON にしてください」を表示。
  → `react-native-root-toast` を利用する場合は `npm i react-native-root-toast`.

---

## 5. 受け入れ基準（AC）

| # | 条件                                                             |
| - | -------------------------------------------------------------- |
| 1 | アプリ起動後 5 秒以内に **現在地マーカー** が表示される                               |
| 2 | 20 m 以上移動するとマーカーが追従（シミュレーターで座標変更も可）                            |
| 3 | マップを手動パンすると追従を停止し、FAB で元位置に戻る                                  |
| 4 | 権限未許可時はダイアログ後に **設定を開くボタン** が表示される                             |
| 5 | GPS OFF 時はトーストが出てクラッシュしない                                      |
| 6 | `npm run lint` / `npm test` が PASS、ビルドも通る (`debug`, `release`) |

---

## 6. 推定作業時間

| 担当     | タスク     | 想定 (h)  |
| ------ | ------- | ------- |
| FE Dev | 1‑1〜1‑2 | 1.5     |
| FE Dev | 2‑1〜2‑2 | 1.0     |
| FE Dev | 3‑1〜3‑2 | 0.5     |
| FE Dev | 4‑1〜4‑2 | 1.0     |
| QA     | 受け入れテスト | 1.0     |
| **合計** |         | **5 h** |

---

## 7. 完了後にやること

* `git commit -m "feat: realtime user location with FAB & permissions UX"`
* `git push` → CI が通ることを確認
* `LOCATION_FIX_REPORT.md` の **Phase A** セクションに *Done ✅* を記入

---

この指示書をもとに、開発→レビュー→マージのフローを進めれば **フェーズ A** は当日中に完了できます。