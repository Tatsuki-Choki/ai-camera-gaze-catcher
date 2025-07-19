
import { type Rect } from './types';

// OpenCV.jsの型定義は提供されていないため、anyとして扱う
// グローバルスコープにcvオブジェクトが存在することを期待
declare const cv: any;

// OpenCVの読み込み完了を管理するPromise
let openCvReady = false;
const onOpenCvReady = new Promise<void>((resolve) => {
  // index.htmlのonloadから呼ばれるグローバル関数
  (window as any).onOpenCvReady = () => {
    console.log('OpenCV.js is ready.');
    openCvReady = true;
    resolve();
  };
});

/**
 * OpenCVが利用可能になるまで待機します。
 */
export const waitOpenCvReady = async () => {
  if (!openCvReady) {
    await onOpenCvReady;
  }
};

/**
 * 指定されたパスから分類器ファイルを読み込みます。
 * @param filePath publicディレクトリからのパス
 * @returns 分類器のファイル名
 */
export const loadClassifier = async (filePath: string): Promise<string> => {
    await waitOpenCvReady();
    
    const url = new URL(filePath, window.location.origin).href;
    console.log(`Fetching classifier from: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    const data = new Uint8Array(buffer);
    
    // ファイルをEmscriptenのファイルシステムに書き込む
    const fileName = filePath.split('/').pop()!;
    cv.FS_createDataFile('/', fileName, data, true, false, false);
    
    console.log(`Classifier ${fileName} loaded and created in virtual FS.`);
    return fileName;
};

/**
 * 画像データから顔を検出します。
 * @param srcMat ソース画像 (cv.Mat)
 * @param classifier 顔検出用の分類器
 * @returns 検出された顔の矩形配列
 */
export const detectFaces = (srcMat: any, classifier: any): Rect[] => {
    const gray = new cv.Mat();
    cv.cvtColor(srcMat, gray, cv.COLOR_RGBA2GRAY, 0);

    const faces = new cv.RectVector();
    const msize = new cv.Size(0, 0);
    classifier.detectMultiScale(gray, faces, 1.1, 3, 0, msize, msize);

    const result: Rect[] = [];
    for (let i = 0; i < faces.size(); ++i) {
        const face = faces.get(i);
        result.push({ x: face.x, y: face.y, width: face.width, height: face.height });
    }

    gray.delete();
    faces.delete();

    return result;
};


/**
 * 顔の領域から目を検出します。
 * @param faceMat 顔の領域 (cv.Mat)
 * @param classifier 目検出用の分類器
 * @returns 検出された目の矩形配列
 */
export const detectEyes = (faceMat: any, classifier: any): Rect[] => {
    const gray = new cv.Mat();
    cv.cvtColor(faceMat, gray, cv.COLOR_RGBA2GRAY, 0);
    
    const eyes = new cv.RectVector();
    const msize = new cv.Size(0, 0);
    classifier.detectMultiScale(gray, eyes, 1.1, 3, 0, msize, msize);

    const result: Rect[] = [];
    for (let i = 0; i < eyes.size(); ++i) {
        const eye = eyes.get(i);
        result.push({ x: eye.x, y: eye.y, width: eye.width, height: eye.height });
    }

    gray.delete();
    eyes.delete();

    return result;
}; 