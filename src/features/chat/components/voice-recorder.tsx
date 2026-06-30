"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceRecorderProps {
  onRecorded: (file: File) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onRecorded, disabled }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTracks = useCallback(() => {
    mediaRef.current?.stream.getTracks().forEach((t) => t.stop());
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopTracks();
    };
  }, [stopTracks]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voice-${Date.now()}.webm`, {
          type: "audio/webm",
        });
        onRecorded(file);
        stopTracks();
      };
      mediaRef.current = recorder;
      recorder.start();
      setRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch {
      // mic permission denied
    }
  };

  const stop = () => {
    mediaRef.current?.stop();
    setRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const cancel = () => {
    chunksRef.current = [];
    mediaRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const formatDuration = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (recording) {
    return (
      <div className="flex items-center gap-2 rounded-full bg-[#FF4458]/10 px-3 py-1.5">
        <span className="size-2 animate-pulse rounded-full bg-[#FF4458]" />
        <div className="flex h-4 w-16 items-center gap-0.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <span
              key={i}
              className="w-0.5 rounded-full bg-[#FF4458]/60"
              style={{ height: `${8 + (i % 3) * 4}px` }}
            />
          ))}
        </div>
        <span className="text-xs font-medium tabular-nums">
          {formatDuration(duration)}
        </span>
        <button type="button" onClick={cancel} className="rounded-full p-1">
          <Trash2 className="size-4 text-muted-foreground" />
        </button>
        <button
          type="button"
          onClick={stop}
          className="rounded-full bg-[#FF4458] p-1.5 text-white"
        >
          <Square className="size-3 fill-current" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={start}
      className={cn(
        "rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50",
      )}
      aria-label="Record voice note"
    >
      <Mic className="size-5" />
    </button>
  );
}
