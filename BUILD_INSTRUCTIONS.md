# AI カメラ目線キャッチャー - ビルド手順

## 必要な準備

1. **依存関係のインストール**
   ```bash
   npm install
   ```

2. **アイコンの準備**（オプション）
   - 1024x1024ピクセルのPNG画像を用意
   - `build/icon.png`に配置
   - 以下のコマンドでICNS形式に変換：
   ```bash
   # macOSでiconutilを使用してICNSファイルを作成
   mkdir build/icon.iconset
   sips -z 16 16     build/icon.png --out build/icon.iconset/icon_16x16.png
   sips -z 32 32     build/icon.png --out build/icon.iconset/icon_16x16@2x.png
   sips -z 32 32     build/icon.png --out build/icon.iconset/icon_32x32.png
   sips -z 64 64     build/icon.png --out build/icon.iconset/icon_32x32@2x.png
   sips -z 128 128   build/icon.png --out build/icon.iconset/icon_128x128.png
   sips -z 256 256   build/icon.png --out build/icon.iconset/icon_128x128@2x.png
   sips -z 256 256   build/icon.png --out build/icon.iconset/icon_256x256.png
   sips -z 512 512   build/icon.png --out build/icon.iconset/icon_256x256@2x.png
   sips -z 512 512   build/icon.png --out build/icon.iconset/icon_512x512.png
   sips -z 1024 1024 build/icon.png --out build/icon.iconset/icon_512x512@2x.png
   iconutil -c icns build/icon.iconset -o build/icon.icns
   rm -rf build/icon.iconset
   ```

## 開発環境での実行

```bash
# Viteの開発サーバーを起動（別ターミナル）
npm run dev

# Electronアプリを開発モードで起動
npm run electron:dev
```

## DMGファイルのビルド

```bash
# Intel MacとApple Silicon Mac両方に対応したDMGを作成
npm run dist:mac
```

ビルドが完了すると、`release`フォルダ内にDMGファイルが生成されます。

## トラブルシューティング

### ビルドエラーが発生する場合

1. node_modulesを削除して再インストール：
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Electronキャッシュをクリア：
   ```bash
   npm cache clean --force
   ```

### アイコンが表示されない場合

- `build/icon.icns`ファイルが正しく生成されているか確認
- 1024x1024ピクセルのPNG画像を使用しているか確認

## 配布

生成されたDMGファイルを他のMacユーザーと共有できます。ユーザーは以下の手順でインストールします：

1. DMGファイルをダブルクリック
2. アプリケーションをApplicationsフォルダにドラッグ&ドロップ
3. Applicationsフォルダからアプリを起動

## セキュリティ注意事項

初回起動時に「開発元が未確認」の警告が表示される場合があります。以下の手順で開きます：

1. Finderでアプリを右クリック
2. 「開く」を選択
3. 表示されるダイアログで「開く」をクリック