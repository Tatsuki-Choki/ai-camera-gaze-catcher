# AI カメラ目線キャッチャー

動画からカメラ目線に近い瞬間を検出し、サムネイル候補として選別・保存できるWebアプリです。解析はブラウザ内で行い、動画ファイルはサーバーへアップロードしません。

## 主な機能

- MP4 / MOV / WebM の動画読み込み
- MediaPipe FaceLandmarkerによる顔向き・視線方向のスコアリング
- 高速 / 標準 / 高精度の解析間隔切り替え
- 検出感度の調整
- 制作ダッシュボードUIでの候補のスコア表示、選択、動画時刻へのジャンプ
- 個別ダウンロード、画像コピー、選択候補のZIP保存

## 使い方

1. 動画をドラッグ＆ドロップ、またはクリックして選択します。
2. 必要に応じて検出感度と解析速度を調整します。
3. 「解析を開始」を押します。
4. 候補をクリックすると動画が該当時刻へ移動します。
5. 必要な候補を選択し、「選択分をZIP保存」でまとめて保存します。

## 開発

```bash
npm install
npm run dev
```

## 検証

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm audit --omit=dev
```

## 技術構成

- React
- TypeScript
- Vite
- Tailwind CSS
- MediaPipe Tasks Vision
- JSZip

## 注意

初回解析時はMediaPipeのWASMとモデルをCDNから読み込みます。完全オフライン利用が必要な場合は、モデル資産を `public` 配下に配置する構成へ変更してください。
