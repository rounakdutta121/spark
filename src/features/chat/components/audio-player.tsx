"use client";

import { useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  src: string;
  className?: string;
}

export function AudioPlayer({ src, className }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      void audio.play();
    }
    setPlaying(!playing);
  };

  const format = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div
      className={cn(
        "flex min-w-[180px] items-center gap-2 rounded-xl bg-black/10 px-3 py-2 dark:bg-white/10",
        className,
      )}
    >
      <audio
        ref={audioRef}
        src={src}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onTimeUpdate={() => setCurrent(audioRef.current?.currentTime ?? 0)}
        onEnded={() => setPlaying(false)}
      />
      <button
        type="button"
        onClick={toggle}
        className="rounded-full bg-white/20 p-1.5"
      >
        {playing ? (
          <Pause className="size-4" />
        ) : (
          <Play className="size-4" />
        )}
      </button>
      <div className="flex flex-1 items-center gap-0.5">
        {Array.from({ length: 20 }).map((_, i) => (
          <span
            key={i}
            className="w-0.5 rounded-full bg-current opacity-40"
            style={{ height: `${6 + ((i * 7) % 11)}px` }}
          />
        ))}
      </div>
      <span className="text-[10px] tabular-nums opacity-70">
        {format(current || duration)}
      </span>
    </div>
  );
}
