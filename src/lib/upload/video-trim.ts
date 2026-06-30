import { spawn } from "child_process";
import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import ffmpegPath from "ffmpeg-static";

export class VideoProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VideoProcessingError";
  }
}

function runFfmpeg(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!ffmpegPath) {
      reject(new VideoProcessingError("Video processing is not available"));
      return;
    }

    const proc = spawn(ffmpegPath, args, { windowsHide: true });
    let stderr = "";

    proc.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    proc.on("error", (error) => reject(error));

    proc.on("close", (code) => {
      if (code === 0) {
        resolve(stderr);
        return;
      }
      reject(
        new VideoProcessingError(
          stderr.trim().split("\n").slice(-3).join(" ") || "Video processing failed",
        ),
      );
    });
  });
}

function runFfmpegProbe(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!ffmpegPath) {
      reject(new VideoProcessingError("Video processing is not available"));
      return;
    }

    const proc = spawn(ffmpegPath, args, { windowsHide: true });
    let stderr = "";

    proc.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    proc.on("error", (error) => reject(error));
    proc.on("close", () => resolve(stderr));
  });
}

function parseDurationSeconds(stderr: string): number | null {
  const match = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!match) return null;

  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  const seconds = Number.parseFloat(match[3]);
  return hours * 3600 + minutes * 60 + seconds;
}

export async function probeVideoDurationSeconds(
  buffer: Buffer,
  inputExt: string,
): Promise<number | null> {
  const dir = await mkdtemp(path.join(tmpdir(), "story-probe-"));
  const inputPath = path.join(dir, `input${inputExt}`);

  try {
    await writeFile(inputPath, buffer);
    const stderr = await runFfmpegProbe(["-i", inputPath]);
    return parseDurationSeconds(stderr);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export async function trimVideoBuffer(
  buffer: Buffer,
  inputExt: string,
  maxSeconds: number,
): Promise<Buffer> {
  const dir = await mkdtemp(path.join(tmpdir(), "story-trim-"));
  const inputPath = path.join(dir, `input${inputExt}`);
  const outputPath = path.join(dir, "output.mp4");

  try {
    await writeFile(inputPath, buffer);
    await runFfmpeg([
      "-i",
      inputPath,
      "-t",
      String(maxSeconds),
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "28",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-movflags",
      "+faststart",
      "-y",
      outputPath,
    ]);
    return await readFile(outputPath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export async function prepareStoryVideo(
  buffer: Buffer,
  inputExt: string,
  maxSeconds: number,
): Promise<{ buffer: Buffer; trimmed: boolean }> {
  const duration = await probeVideoDurationSeconds(buffer, inputExt);
  const needsTranscode = inputExt.toLowerCase() !== ".mp4";
  const withinLimit = duration !== null && duration <= maxSeconds + 0.05;

  if (withinLimit && !needsTranscode) {
    return { buffer, trimmed: false };
  }

  const output = await trimVideoBuffer(buffer, inputExt, maxSeconds);
  return {
    buffer: output,
    trimmed: duration !== null && duration > maxSeconds + 0.05,
  };
}
