import { STORY_MAX_VIDEO_SECONDS } from "@/lib/social/story-constants";

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const duration = video.duration;
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(duration) ? duration : 0);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read video metadata"));
    };
    video.src = url;
  });
}

function recordVideoSegment(
  file: File,
  maxSeconds: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.src = url;

    video.onloadedmetadata = async () => {
      try {
        const stream =
          "captureStream" in video
            ? (video as HTMLVideoElement & { captureStream(): MediaStream }).captureStream()
            : null;

        if (!stream) {
          URL.revokeObjectURL(url);
          reject(new Error("Video trimming is not supported in this browser"));
          return;
        }

        const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
          ? "video/webm;codecs=vp9"
          : MediaRecorder.isTypeSupported("video/webm")
            ? "video/webm"
            : "video/mp4";

        const recorder = new MediaRecorder(stream, { mimeType });
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
          URL.revokeObjectURL(url);
          resolve(new Blob(chunks, { type: mimeType.split(";")[0] }));
        };

        recorder.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error("Failed to trim video"));
        };

        recorder.start(250);
        await video.play();

        const stopAt = Math.min(maxSeconds, video.duration || maxSeconds) * 1000;
        window.setTimeout(() => {
          recorder.stop();
          video.pause();
        }, stopAt);
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error instanceof Error ? error : new Error("Failed to trim video"));
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load video for trimming"));
    };
  });
}

export async function prepareStoryVideoFile(
  file: File,
): Promise<{ file: File; trimmed: boolean }> {
  if (!file.type.startsWith("video/")) {
    return { file, trimmed: false };
  }

  const duration = await getVideoDuration(file);
  if (duration <= STORY_MAX_VIDEO_SECONDS + 0.25) {
    return { file, trimmed: false };
  }

  const blob = await recordVideoSegment(file, STORY_MAX_VIDEO_SECONDS);
  const ext = blob.type.includes("webm") ? ".webm" : ".mp4";
  return {
    file: new File([blob], `story${ext}`, { type: blob.type }),
    trimmed: true,
  };
}
