import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

let faceLandmarker: FaceLandmarker | undefined = undefined;

export const createFaceLandmarker = async (): Promise<FaceLandmarker> => {
  if (faceLandmarker) {
    console.log("FaceLandmarker already initialized");
    return faceLandmarker;
  }
  
  try {
    console.log("Initializing FaceLandmarker...");
    
    const filesetResolver = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.12/wasm"
    );
    console.log("FilesetResolver loaded");
    
    faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
        delegate: "CPU", // Changed from GPU to CPU for better compatibility
      },
      outputFaceBlendshapes: true,
      runningMode: "VIDEO",
      numFaces: 1, // Focus on one primary face for performance
    });
    
    console.log("FaceLandmarker initialized successfully");
    return faceLandmarker;
  } catch (error) {
    console.error("Failed to initialize FaceLandmarker:", error);
    throw error;
  }
};