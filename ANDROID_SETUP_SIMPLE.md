# Android実機テスト - 簡単セットアップガイド

## 現在の状況
✅ Firebase設定完了（google-services.json）
✅ Gradle設定修正完了
✅ React Native環境準備中

## 必要な手順（優先順位順）

### 1. 最優先：Android Studioの完全セットアップ
```bash
# 既にインストールが開始されています
# Android Studioアプリを開いて初期設定を完了してください
```

**Android Studio初回起動時の設定：**
1. **SDK Manager** を開く
2. **Android 13 (API 33)** をインストール
3. **SDK Build-Tools 35.0.0** をインストール
4. **Android Emulator** をインストール

### 2. 環境変数の設定
```bash
# ~/.zshrc または ~/.bash_profile に追加
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin

# 設定を反映
source ~/.zshrc
```

### 3. Java 17の設定
```bash
# Homebrewでのインストールが完了後
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

### 4. Android端末の接続確認
```bash
# 端末が認識されているか確認
adb devices

# 期待される出力例：
# List of devices attached
# ABC123DEF456    device
```

### 5. アプリのビルドとインストール
```bash
# Metroサーバーを起動（別ターミナル）
npm start

# アプリをビルドして端末にインストール
npm run android
```

## トラブルシューティング

### Android端末が認識されない場合
```bash
# USBデバッグが有効になっているか確認
# 設定 → 開発者オプション → USBデバッグ

# ADBサーバーを再起動
adb kill-server
adb start-server
adb devices
```

### ビルドエラーの場合
```bash
# Gradleキャッシュをクリア
cd android && ./gradlew clean && cd ..

# node_modulesを再インストール
rm -rf node_modules
npm install

# Metro キャッシュをクリア
npm start -- --reset-cache
```

### JDKエラーの場合
```bash
# Java バージョンを確認
java -version

# JDK 17がインストールされていない場合
brew install openjdk@17

# 環境変数を設定
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

## 現在のアプリの特徴

### 実装済み機能
- 🚽 トイレ情報の投稿・検索・表示
- 📍 位置情報とマップ機能
- 👤 ユーザー認証（Firebase Auth）
- ⭐ レビュー・評価システム
- 📱 通知機能
- 🛡️ レポート・制限システム
- 🏆 バッジ・実績システム

### 実機テストで確認すべき項目
1. **位置情報の取得** - GPS機能の動作
2. **カメラ機能** - 写真撮影・アップロード
3. **マップ表示** - Google Maps API
4. **Firebase連携** - データの保存・取得
5. **プッシュ通知** - FCM通知の受信
6. **パフォーマンス** - 動作速度・メモリ使用量

## 次のステップ

1. **Android Studio セットアップ完了** まで待機
2. **Android端末の準備**（USBデバッグ有効化）
3. **初回ビルド実行**（15-20分予想）
4. **基本機能テスト**
5. **Firebase機能テスト**

---

## 急いでテストしたい場合の代替案

### エミュレーター使用
```bash
# Android Studioでエミュレーターを作成・起動後
npm run android
```

### iOS端末での代替テスト
```bash
# iPhoneをお持ちの場合
npm run ios
```

このセットアップが完了すれば、実機での本格的なテストが可能になります！