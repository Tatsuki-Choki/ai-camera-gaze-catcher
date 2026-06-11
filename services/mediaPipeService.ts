import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

// メインスレッドとWorkerでそれぞれモジュールインスタンスが分かれるため、
// このシングルトンは各実行コンテキストごとに1つ作られる。
let faceLandmarker: FaceLandmarker | null = null;
let faceLandmarkerPromise: Promise<FaceLandmarker> | null = null;

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

const buildLandmarker = async (delegate: 'GPU' | 'CPU'): Promise<FaceLandmarker> => {
  const vision = await FilesetResolver.forVisionTasks(WASM_URL);
  return FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: MODEL_URL,
      delegate,
    },
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: true,
    runningMode: 'VIDEO',
    numFaces: 1,
  });
};

export const createFaceLandmarker = async (): Promise<FaceLandmarker> => {
  if (faceLandmarker) {
    return faceLandmarker;
  }

  if (!faceLandmarkerPromise) {
    faceLandmarkerPromise = (async () => {
      try {
        faceLandmarker = await buildLandmarker('GPU');
      } catch {
        faceLandmarker = await buildLandmarker('CPU');
      }
      return faceLandmarker;
    })().catch((error: unknown) => {
      faceLandmarkerPromise = null;
      throw error;
    });
  }

  return faceLandmarkerPromise;
};
