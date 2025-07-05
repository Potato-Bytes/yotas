# 実機テストガイド

## Android端末でのテスト（推奨）

### 必要な準備
1. **Android Studio** をインストール
   ```bash
   # Homebrew経由でインストール
   brew install --cask android-studio
   ```

2. **Android SDK** の設定
   - Android Studio起動 → SDK Manager → Android 13 (API 33) をインストール
   - PATH環境変数の設定:
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

### Android端末の準備
1. **開発者オプション** を有効化:
   - 設定 → デバイス情報 → ビルド番号を7回タップ
   
2. **USBデバッグ** を有効化:
   - 設定 → 開発者オプション → USBデバッグをON
   
3. **端末をMacに接続**:
   - USB-Cケーブルで接続
   - 「このコンピューターを常に信頼する」を選択

### アプリのビルドと実行
```bash
# 端末が接続されているか確認
adb devices

# Metroサーバーを起動（別ターミナル）
npm start

# アプリをビルドして端末にインストール
npm run android

# または特定の端末を指定
npm run android --device="端末名"
```

## iOS端末でのテスト

### 必要な準備
1. **Xcode** をインストール（App Store）
2. **iOS端末** をMacに接続
3. **Apple Developer Account**（無料でも可）

### iOS端末の準備
1. **信頼されたデベロッパー** として設定:
   - 設定 → 一般 → VPNとデバイス管理 → 開発者アプリ → 信頼
   
2. **端末をMacに接続**:
   - Lightningケーブルで接続
   - 「このコンピューターを信頼しますか？」で「信頼」を選択

### アプリのビルドと実行
```bash
# iOSシミュレーター一覧を確認
xcrun simctl list devices

# iOSアプリをビルドして実行
npm run ios

# 特定のシミュレーターを指定
npm run ios --simulator="iPhone 15"

# 実機を指定（UDIDが必要）
npm run ios --device
```

## 簡単な代替方法：Expo Go（もし対応していれば）

### Expo Go アプリ
1. **App Store/Google Play** から「Expo Go」をダウンロード
2. **プロジェクトがExpo対応** の場合のみ利用可能
3. **QRコード** でアプリをスキャンして実行

```bash
# Expoプロジェクトの場合
npx expo start
# QRコードが表示されるので、Expo Goアプリでスキャン
```

## トラブルシューティング

### Android関連
```bash
# Android端末が認識されない場合
adb kill-server
adb start-server
adb devices

# ビルドエラーの場合
cd android && ./gradlew clean && cd ..
npm run android

# Metro cache をクリア
npm start -- --reset-cache
```

### iOS関連
```bash
# iOSビルドエラーの場合
cd ios && xcodebuild clean && cd ..
cd ios && pod install && cd ..
npm run ios

# Metro cache をクリア
npm start -- --reset-cache
```

### Firebase設定の確認
```bash
# Android: google-services.json が正しい場所にあるか確認
ls android/app/google-services.json

# iOS: GoogleService-Info.plist が正しい場所にあるか確認
ls ios/yotas/GoogleService-Info.plist
```

## 実機テストのメリット

1. **実際のパフォーマンス** を確認可能
2. **GPS機能** のテスト
3. **カメラ機能** のテスト
4. **実際のネットワーク環境** でのテスト
5. **タッチ操作** の自然な感触
6. **バッテリー消費** の確認

## 注意点

- **初回ビルド** は時間がかかります（10-20分）
- **Firebase設定** が正しく行われているか確認
- **権限設定**（位置情報、カメラ等）の確認
- **ネットワーク接続** の確認