# 開発環境の再開手順

## 1. 端末を接続
USBケーブルでAndroid端末をMacに接続

## 2. 接続確認
```bash
adb devices
```

## 3. Metro Bundlerを起動
```bash
npx react-native start --port 8082 --reset-cache
```

## 4. ポートフォワーディング設定
別のターミナルで実行：
```bash
adb reverse tcp:8082 tcp:8082
```

## 5. アプリをビルド・実行
```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
npx react-native run-android --device 2B081JEGR05936 --port 8082
```

## トラブルシューティング

### アプリが起動しない場合
```bash
# アプリを強制終了して再起動
adb shell am force-stop com.yotas
adb shell am start -n com.yotas/.MainActivity
```

### ログを確認したい場合
```bash
npx react-native log-android
```

### ビルドエラーが出た場合
```bash
cd android && ./gradlew clean
cd ..
```

## 注意事項
- 端末のUSBデバッグが有効になっていることを確認
- 同じデバイスIDでない場合は、`adb devices`で確認して変更