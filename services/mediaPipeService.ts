import {
  FaceLandmarker,
  FilesetResolver,
  type FaceLandmarkerResult,
} from '@mediapipe/tasks-vision';

let faceLandmarker: FaceLandmarker | null = null;
let faceLandmarkerPromise: Promise<FaceLandmarker> | null = null;

export const createFaceLandmarker = async (): Promise<FaceLandmarker> => {
  if (faceLandmarker) {
    return faceLandmarker;
  }

  if (!faceLandmarkerPromise) {
    faceLandmarkerPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm',
      );

      faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'CPU',
        },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
        runningMode: 'VIDEO',
        numFaces: 1,
      });

      return faceLandmarker;
    })().catch((error: unknown) => {
      faceLandmarkerPromise = null;
      throw error;
    });
  }

  return faceLandmarkerPromise;
};

export const getBlendshapeScore = (
  result: FaceLandmarkerResult,
  categoryName: string,
): number => {
  const categories = result.faceBlendshapes[0]?.categories ?? [];
  return categories.find((category) => category.categoryName === categoryName)?.score ?? 0;
};
