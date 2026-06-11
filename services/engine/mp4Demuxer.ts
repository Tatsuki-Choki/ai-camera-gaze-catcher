import {
  createFile,
  DataStream,
  Endianness,
  MP4BoxBuffer,
  VisualSampleEntry,
  type ISOFile,
  type Movie,
  type Sample,
  type Track,
} from 'mp4box';

export interface DemuxedMp4 {
  decoderConfig: VideoDecoderConfig;
  durationSeconds: number;
  width: number;
  height: number;
  /** デコード順のEncodedVideoChunk。消費に合わせてファイルを読み進める。 */
  chunks: AsyncGenerator<EncodedVideoChunk, void, void>;
}

const EXTRACTION_BATCH = 100;

// avc1/hevc系はcodec-specificなdescriptionが必須。vp9/av1は不要。
const getDescription = (isoFile: ISOFile, trackId: number): Uint8Array | undefined => {
  const trak = isoFile.getTrackById(trackId);
  const entries = trak?.mdia?.minf?.stbl?.stsd?.entries ?? [];
  for (const entry of entries) {
    if (!(entry instanceof VisualSampleEntry)) {
      continue;
    }
    const box = entry.avcC ?? entry.hvcC;
    if (box) {
      const stream = new DataStream(undefined, 0, Endianness.BIG_ENDIAN);
      // writeはDataStreamのメソッドしか使わないためMultiBufferStreamへのキャストで安全
      box.write(stream as unknown as import('mp4box').MultiBufferStream);
      return new Uint8Array(stream.buffer, 8);
    }
  }
  return undefined;
};

const toArrayBuffer = (value: Uint8Array): ArrayBuffer => {
  if (value.byteOffset === 0 && value.byteLength === value.buffer.byteLength) {
    return value.buffer as ArrayBuffer;
  }
  return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer;
};

const toChunk = (sample: Sample): EncodedVideoChunk | null => {
  if (!sample.data) {
    return null;
  }
  return new EncodedVideoChunk({
    type: sample.is_sync ? 'key' : 'delta',
    timestamp: Math.round((sample.cts * 1e6) / sample.timescale),
    duration: Math.round((sample.duration * 1e6) / sample.timescale),
    data: sample.data,
  });
};

export const demuxMp4 = async (file: File): Promise<DemuxedMp4> => {
  const isoFile = createFile();
  const reader = file.stream().getReader();
  let fileOffset = 0;
  let fileFullyRead = false;
  let parseError: Error | null = null;

  const pendingSamples: Sample[] = [];
  let movieInfo: Movie | null = null;

  isoFile.onError = (module: string, message: string) => {
    parseError = new Error(`MP4の解析に失敗しました: ${module} ${message}`);
  };
  isoFile.onReady = (info) => {
    movieInfo = info;
  };

  const appendNext = async (): Promise<boolean> => {
    const { done, value } = await reader.read();
    if (done) {
      fileFullyRead = true;
      isoFile.flush();
      return false;
    }
    const buffer = MP4BoxBuffer.fromArrayBuffer(toArrayBuffer(value), fileOffset);
    fileOffset += value.byteLength;
    isoFile.appendBuffer(buffer);
    if (parseError) {
      throw parseError;
    }
    return true;
  };

  // moov（メタデータ）が見つかるまで読み進める
  while (!movieInfo) {
    const hasMore = await appendNext();
    if (!hasMore && !movieInfo) {
      throw new Error('動画のメタデータ（moov）が見つかりませんでした。');
    }
  }

  const info: Movie = movieInfo;
  const track: Track | undefined = info.videoTracks[0];
  if (!track || !track.video) {
    throw new Error('動画トラックが見つかりませんでした。');
  }
  const trackId = track.id;

  const decoderConfig: VideoDecoderConfig = {
    codec: track.codec,
    codedWidth: track.video.width,
    codedHeight: track.video.height,
    description: getDescription(isoFile, trackId),
  };

  const durationSeconds = info.duration > 0
    ? info.duration / info.timescale
    : track.samples_duration / track.timescale;

  isoFile.onSamples = (_id, _user, samples) => {
    pendingSamples.push(...samples);
  };
  isoFile.setExtractionOptions(trackId, undefined, { nbSamples: EXTRACTION_BATCH });
  isoFile.start();

  async function* chunks(): AsyncGenerator<EncodedVideoChunk, void, void> {
    try {
      while (true) {
        while (pendingSamples.length > 0) {
          const sample = pendingSamples.shift() as Sample;
          const chunk = toChunk(sample);
          isoFile.releaseUsedSamples(trackId, sample.number);
          if (chunk) {
            yield chunk;
          }
        }

        if (fileFullyRead) {
          break;
        }
        // 消費に合わせて読み進める（メモリへの先読みを抑える）
        await appendNext();
      }
    } finally {
      reader.releaseLock();
      isoFile.stop();
    }
  }

  return {
    decoderConfig,
    durationSeconds,
    width: track.video.width,
    height: track.video.height,
    chunks: chunks(),
  };
};
