import type { FaceLandmarkerResult, Matrix } from '@mediapipe/tasks-vision';
import type { GazeFrameFeatures } from '../../types';

// 毎フレーム10項目を52件のリストからfindするのを避け、一度Map化して引く
const getBlendshapeMap = (result: FaceLandmarkerResult): Map<string, number> => {
  const categories = result.faceBlendshapes[0]?.categories ?? [];
  return new Map(categories.map((category) => [category.categoryName, category.score]));
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
  const blendshapes = getBlendshapeMap(result);
  const score = (name: string) => blendshapes.get(name) ?? 0;

  return {
    hasFace,
    eyeLookOutLeft: score('eyeLookOutLeft'),
    eyeLookOutRight: score('eyeLookOutRight'),
    eyeLookInLeft: score('eyeLookInLeft'),
    eyeLookInRight: score('eyeLookInRight'),
    eyeLookUpLeft: score('eyeLookUpLeft'),
    eyeLookUpRight: score('eyeLookUpRight'),
    eyeLookDownLeft: score('eyeLookDownLeft'),
    eyeLookDownRight: score('eyeLookDownRight'),
    eyeBlinkLeft: score('eyeBlinkLeft'),
    eyeBlinkRight: score('eyeBlinkRight'),
    headYaw: headPose.yaw,
    headPitch: headPose.pitch,
    headRoll: headPose.roll,
  };
};
