# Yotas App セットアップガイド

このガイドでは、Yotasアプリケーションの開発環境をセットアップする手順を説明します。

## 前提条件

- Node.js (v18以上)
- React Native開発環境
- Android Studio
- Xcode (iOS開発の場合)

## 必要なAPIキーとサービス

### 1. Firebase

1. [Firebase Console](https://console.firebase.google.com/) でプロジェクトを作成
2. Android/iOSアプリを追加
3. 設定ファイルをダウンロード:
   - Android: `google-services.json`
   - iOS: `GoogleService-Info.plist`

### 2. Google Maps API

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成
2. Maps SDK for Android/iOS APIを有効化
3. APIキーを作成し、使用制限を設定

### 3. Google Sign-In

1. Firebase Console で Authentication > Sign-in method を設定
2. Googleサインインを有効化
3. WebクライアントIDを取得

## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone [repository-url]
cd yotas
```

### 2. 依存関係のインストール

```bash
npm install
cd ios && pod install && cd ..
```

### 3. Firebase設定ファイルの配置

#### Android
```bash
# google-services.json.example をコピーして編集
cp android/app/google-services.json.example android/app/google-services.json
# あなたのFirebase設定で google-services.json を更新してください
```

#### iOS
```bash
# GoogleService-Info.plist.example をコピーして編集
cp ios/yotas/GoogleService-Info.plist.example ios/yotas/GoogleService-Info.plist
# あなたのFirebase設定で GoogleService-Info.plist を更新してください
```

### 4. APIキーの設定

#### Android
`android/app/src/main/res/values/secrets.xml` を編集:
```xml
<string name="google_maps_api_key">YOUR_ACTUAL_GOOGLE_MAPS_API_KEY</string>
```

#### iOS
`ios/yotas/Secrets.plist` を編集:
```xml
<key>GOOGLE_MAPS_API_KEY</key>
<string>YOUR_ACTUAL_GOOGLE_MAPS_API_KEY</string>
```

### 5. 環境変数の設定

```bash
# .env.example をコピーして編集
cp .env.example .env
# あなたの実際の値で .env を更新してください
```

### 6. ソースコードの更新

`src/services/authService.ts` の webClientId を更新:
```typescript
GoogleSignin.configure({
  webClientId: 'YOUR_ACTUAL_GOOGLE_WEB_CLIENT_ID',
});
```

## セキュリティ注意事項

⚠️ **重要**: 以下のファイルは絶対にGitにコミットしないでください:
- `google-services.json`
- `GoogleService-Info.plist`
- `secrets.xml`
- `Secrets.plist`
- `.env`

これらのファイルには機密情報が含まれており、公開リポジトリにコミットするとセキュリティリスクが発生します。

## トラブルシューティング

### 一般的な問題

1. **ビルドエラー**: Firebase設定ファイルが正しく配置されているか確認
2. **Google Maps表示されない**: APIキーの設定と使用制限を確認
3. **Google認証エラー**: WebクライアントIDが正しく設定されているか確認

### デバッグ用コマンド

```bash
# Android
npx react-native run-android

# iOS
npx react-native run-ios

# Metro サーバーの起動
npx react-native start
```

## 本番環境デプロイ

本番環境では以下の点にご注意ください:

1. 本番用のFirebaseプロジェクトを使用
2. APIキーの使用制限を適切に設定
3. リリース用キーストアを使用
4. セキュリティルールを適切に設定

## サポート

問題が発生した場合は、Issue を作成してください。