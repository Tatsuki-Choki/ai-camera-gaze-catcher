import type { FaceLandmarkerResult, Matrix } from '@mediapipe/tasks-vision';
import type { GazeFrameFeatures } from '../../types';

const getBlendshapeScore = (
  result: FaceLandmarkerResult,
  categoryName: string,
): number => {
  const categories = result.faceBlendshapes[0]?.categories ?? [];
  return categories.find((category) => category.categoryName === categoryName)?.score ?? 0;
};

const getHeadPose = (matrix: Matrix | undefined) => {
  const data = matrix?.data ?? [];
  if (data.length < 11) {
    return { yaw: 0, pitch: 0, roll: 0 };
  }

  const yaw = Math.atan2(data[8], data[10]);
  const pitch = Math.atan2(-data[9], Math.hypot(data[8], data[10]));
  const roll = Math.atan2(data[4], data[0]);

  return { yaw, pitch, roll };
};

export const extractGazeFeatures = (result: FaceLandmarkerResult): GazeFrameFeatures => {
  const hasFace = (result.faceLandmarks?.length ?? 0) > 0;
  const headPose = getHeadPose(result.facialTransformationMatrixes?.[0]);

  return {
    hasFace,
    eyeLookOutLeft: getBlendshapeScore(result, 'eyeLookOutLeft'),
    eyeLookOutRight: getBlendshapeScore(result, 'eyeLookOutRight'),
    eyeLookInLeft: getBlendshapeScore(result, 'eyeLookInLeft'),
    eyeLookInRight: getBlendshapeScore(result, 'eyeLookInRight'),
    eyeLookUpLeft: getBlendshapeScore(result, 'eyeLookUpLeft'),
    eyeLookUpRight: getBlendshapeScore(result, 'eyeLookUpRight'),
    eyeLookDownLeft: getBlendshapeScore(result, 'eyeLookDownLeft'),
    eyeLookDownRight: getBlendshapeScore(result, 'eyeLookDownRight'),
    eyeBlinkLeft: getBlendshapeScore(result, 'eyeBlinkLeft'),
    eyeBlinkRight: getBlendshapeScore(result, 'eyeBlinkRight'),
    headYaw: headPose.yaw,
    headPitch: headPose.pitch,
    headRoll: headPose.roll,
  };
};
