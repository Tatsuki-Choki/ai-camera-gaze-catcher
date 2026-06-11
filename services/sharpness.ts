// ブレたフレームを候補から避けるためのシャープネス指標。
// 縮小グレースケール画像に対する4近傍ラプラシアンの分散を返す。

export const laplacianVariance = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
): number => {
  if (width < 3 || height < 3) {
    return 0;
  }

  const gray = new Float32Array(width * height);
  for (let i = 0; i < width * height; i += 1) {
    const offset = i * 4;
    gray[i] = data[offset] * 0.299 + data[offset + 1] * 0.587 + data[offset + 2] * 0.114;
  }

  let sum = 0;
  let sumSq = 0;
  const count = (width - 2) * (height - 2);

  for (let y = 1; y < height - 1; y += 1) {
    const row = y * width;
    for (let x = 1; x < width - 1; x += 1) {
      const i = row + x;
      const lap = gray[i - width] + gray[i + width] + gray[i - 1] + gray[i + 1] - 4 * gray[i];
      sum += lap;
      sumSq += lap * lap;
    }
  }

  const mean = sum / count;
  return sumSq / count - mean * mean;
};

// 分散（0〜数千）を 0..1 に押し込む単調写像。ピーク領域内での順位付けに使う。
export const normalizeSharpness = (variance: number): number => (
  variance / (variance + 120)
);
