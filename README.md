# AI カメラ目線キャッチャー

動画からカメラ目線に近い瞬間を検出し、サムネイル候補として選別・保存できるWebアプリです。解析はブラウザ内で行い、動画ファイルはサーバーへアップロードしません。

## 主な機能

- MP4 / MOV / WebM の動画読み込み
- **WebCodecs + Web Worker による高速解析**（MP4 / MOV、非対応環境はシーク方式へ自動フォールバック）
- MediaPipe FaceLandmarker（GPU優先）による顔向き・視線方向のスコアリング
- 視線の方向ベクトル化・まばたき除外・シャープネス（ブレ）判定を組み合わせた候補選定
- ピーク検出による「各ベストの1枚」抽出（適応サンプリングで高スコア付近を細かく解析）
- 視線スコアタイムライン表示（クリックでシーク）
- 解析中も動画プレイヤーを自由に操作可能
- 3ステップのワークフローガイド付きサイドバー（今やるべき操作を常に明示）
- ライト / ダークテーマ切り替え（デフォルトはライト、映像ステージは常時ダーク）
- 高速 / 標準 / 高精度の解析間隔切り替えと検出感度の調整
- 候補のグリッド表示・時刻順 / スコア順ソート・拡大プレビュー
- JPEG / PNG選択、個別ダウンロード、クリップボードコピー、ZIP一括保存

## 使い方

1. 動画をドラッグ＆ドロップ、またはクリックして選択します。
2. 必要に応じて検出感度・解析の細かさ・保存形式を調整します。
3. 「解析を開始」を押します。
4. タイムラインや候補をクリックすると動画が該当時刻へ移動します。
5. 必要な候補を選択し、「選択分を保存」でまとめてZIP保存します。

詳細は [USAGE_GUIDE.md](./USAGE_GUIDE.md) を参照してください。

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

- React 19 / TypeScript / Vite
- Tailwind CSS
- MediaPipe Tasks Vision（FaceLandmarker, GPU delegate優先）
- WebCodecs（VideoDecoder） + mp4box.js（デマックス）
- Web Worker（解析をメインスレッドから分離）
- JSZip

## アーキテクチャ概要

```
App.tsx
 └─ hooks/useAnalysisEngine.ts   … エンジン選択・状態管理・フォールバック
     ├─ workers/analysis.worker.ts  … WebCodecsエンジン（MP4/MOV）
     │   └─ services/engine/mp4Demuxer.ts
     └─ services/engine/seekEngine.ts … シーク方式フォールバック（WebM等）
         （両エンジン共通）
         ├─ services/engine/framePipeline.ts … スコアリング・候補画像生成
         ├─ services/gazeScoring.ts          … 視線スコア（方向ベクトル化＋まばたき）
         ├─ services/sharpness.ts            … Laplacian分散によるブレ判定
         └─ services/peakTracker.ts          … ストリーミングピーク抽出（NMS）
```

## 注意

初回解析時はMediaPipeのWASMとモデルをCDNから読み込みます。完全オフライン利用が必要な場合は、モデル資産を `public` 配下に配置する構成へ変更してください。
