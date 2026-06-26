"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@repo/design-system/components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/design-system/components/ui/popover";
import { Separator } from "@repo/design-system/components/ui/separator";
import { Skeleton } from "@repo/design-system/components/ui/skeleton";
import { Slider } from "@repo/design-system/components/ui/slider";
import { cn } from "@repo/design-system/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  FileDown,
  Gauge,
  Pause,
  Play,
  Search,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  type CSSProperties,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import WaveSurfer, { type WaveSurferOptions } from "wavesurfer.js";
import { ErrorState } from "./error-state";
import { formatTime } from "./lib";

export interface AudioPlayerProps {
  /** Accent color for the waveform + cursor — any CSS color / var. */
  accentColor?: string;
  /** Filename used when downloading the audio. */
  audioName?: string;
  autoPlay?: boolean;
  className?: string;
  customErrorMessage?: string;
  /** Default playback rate (0.25–2). */
  defaultPlaybackRate?: number;
  /** Default volume in [0, 1]. */
  defaultVolume?: number;
  /** Prev/Next transcript-match buttons. */
  enableTranscriptNavigation?: boolean;
  /** Exposes the WaveSurfer instance to the parent (seek, setTime, etc.). */
  getWaveSurferRef?: (ref: WaveSurfer | null) => void;
  /** Parent-provided loading state, stacked on top of waveform-ready gating. */
  isLoading?: boolean;
  loop?: boolean;
  onCopyTranscript?: () => void;
  onDownloadTranscript?: () => void;
  onDuration?: (duration: number) => void;
  onEnded?: () => void;
  onError?: () => void;
  onMuteChange?: (isMuted: boolean) => void;
  onNext?: () => void;
  onPause?: () => void;
  onPlay?: () => void;
  onPlaybackRateChange?: (rate: number) => void;
  onPrevious?: () => void;
  onProgress?: (currentTime: number, duration: number) => void;
  onReady?: () => void;
  onSearch?: (search: string) => void;
  onSeeked?: (time: number) => void;
  onVolumeChange?: (volume: number) => void;
  /** Search-bar bindings — shown if `onSearch` is provided. */
  search?: string;
  /** Counter shown inside the search row when transcript navigation is on. */
  searchMatchCount?: { current: number; total: number };
  /** Start playback at this time (seconds). */
  seekTo?: number;
  /** Show the download-audio button. */
  showDownloadButton?: boolean;
  src: string;
  style?: CSSProperties;
}

const PLAYBACK_RATE_MIN = 0.25;
const PLAYBACK_RATE_MAX = 2;
const PLAYBACK_RATE_STEP = 0.25;

interface WaveSurferEventHandlers {
  mountedRef: { current: boolean };
  onReadyInternal: (duration: number) => void;
  setIsPlaying: (value: boolean) => void;
  setCurrentTime: (value: number) => void;
  setAudioError: (value: boolean) => void;
  onReady?: () => void;
  onDuration?: (duration: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: () => void;
  onProgress?: (currentTime: number, duration: number) => void;
  onSeeked?: (time: number) => void;
}

function bindWaveSurferEvents(
  ws: WaveSurfer,
  handlers: WaveSurferEventHandlers
) {
  const alive = () => handlers.mountedRef.current;
  ws.on("ready", () => {
    if (!alive()) {
      return;
    }
    const dur = ws.getDuration() || 0;
    handlers.onReadyInternal(dur);
    handlers.onReady?.();
    handlers.onDuration?.(dur);
  });
  ws.on("play", () => {
    if (!alive()) {
      return;
    }
    handlers.setIsPlaying(true);
    handlers.onPlay?.();
  });
  ws.on("pause", () => {
    if (!alive()) {
      return;
    }
    handlers.setIsPlaying(false);
    handlers.onPause?.();
  });
  ws.on("finish", () => {
    if (!alive()) {
      return;
    }
    handlers.setIsPlaying(false);
    handlers.onEnded?.();
  });
  ws.on("error", () => {
    if (!alive()) {
      return;
    }
    handlers.setAudioError(true);
    handlers.onError?.();
  });
  ws.on("timeupdate", (time) => {
    if (!alive()) {
      return;
    }
    handlers.setCurrentTime(time);
    handlers.onProgress?.(time, ws.getDuration() || 0);
  });
  ws.on("seeking", (time) => {
    if (!alive()) {
      return;
    }
    handlers.setCurrentTime(time);
    handlers.onSeeked?.(time);
  });
}

export const AudioPlayer = memo(function AudioPlayer({
  src,
  accentColor = "var(--color-primary)",
  autoPlay = false,
  loop = false,
  className,
  style,
  audioName,
  defaultVolume = 1,
  defaultPlaybackRate = 1,
  seekTo,
  showDownloadButton = false,
  isLoading = false,
  customErrorMessage = "An error occurred while trying to play the audio.",
  getWaveSurferRef,
  onProgress,
  onSeeked,
  onPlay,
  onPause,
  onEnded,
  onReady,
  onError,
  onDuration,
  onPlaybackRateChange,
  onVolumeChange,
  onMuteChange,
  search,
  onSearch,
  onCopyTranscript,
  onDownloadTranscript,
  enableTranscriptNavigation,
  onPrevious,
  onNext,
  searchMatchCount,
}: AudioPlayerProps) {
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const waveSurferRef = useRef<WaveSurfer | null>(null);
  const mountedRef = useRef(true);
  const lastVolumeRef = useRef<number>(defaultVolume);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(defaultVolume);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioError, setAudioError] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(defaultPlaybackRate);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isWaveformReady, setIsWaveformReady] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const containerStyle = useMemo<CSSProperties>(
    () => ({
      ...style,
      minWidth: "90px",
    }),
    [style]
  );

  const showSearchRow = Boolean(
    onSearch ||
      onCopyTranscript ||
      onDownloadTranscript ||
      enableTranscriptNavigation
  );

  const applyVolume = useCallback(
    (next: number) => {
      const clamped = Math.min(Math.max(next, 0), 1);
      setVolume(clamped);
      waveSurferRef.current?.setVolume(clamped);
      const shouldMute = clamped === 0;
      setIsMuted(shouldMute);
      if (clamped > 0) {
        lastVolumeRef.current = clamped;
      }
      onVolumeChange?.(clamped);
      onMuteChange?.(shouldMute);
    },
    [onVolumeChange, onMuteChange]
  );

  const togglePlay = useCallback(() => {
    const ws = waveSurferRef.current;
    if (!ws) {
      return;
    }
    if (ws.isPlaying()) {
      ws.pause();
    } else {
      ws.play().catch(() => undefined);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (nextMuted) {
      lastVolumeRef.current = volume || 1;
      applyVolume(0);
    } else {
      applyVolume(lastVolumeRef.current || 1);
    }
    waveSurferRef.current?.setMuted(nextMuted);
  }, [isMuted, volume, applyVolume]);

  const handleDownloadClick = useCallback(async () => {
    if (isDownloading) {
      return;
    }
    try {
      setIsDownloading(true);
      const response = await fetch(src);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const extension = src.split(".").pop() ?? "mp3";
      link.download = audioName || `audio.${extension}`;
      link.click();
      URL.revokeObjectURL(url);
      link.remove();
    } catch {
      // Swallow — download failures don't need to explode the player.
    } finally {
      setIsDownloading(false);
    }
  }, [isDownloading, src, audioName]);

  const reloadAudio = useCallback(() => {
    setAudioError(false);
    setReloadKey((prev) => prev + 1);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally resubscribed on reload/seek changes
  useEffect(() => {
    if (!waveformRef.current) {
      return;
    }
    setIsWaveformReady(false);

    if (waveSurferRef.current) {
      try {
        waveSurferRef.current.destroy();
      } catch {
        // ignore
      }
      waveSurferRef.current = null;
    }

    // Resolve the accent color to a concrete CSS value — WaveSurfer paints to
    // a canvas, which can't read CSS custom properties directly.
    const resolvedAccent =
      accentColor.startsWith("var(") && typeof window !== "undefined"
        ? getComputedStyle(document.documentElement)
            .getPropertyValue(accentColor.slice(4, -1).trim())
            .trim() || "#0f62fe"
        : accentColor;

    const options: WaveSurferOptions = {
      container: waveformRef.current,
      waveColor: "#9ca3af",
      progressColor: resolvedAccent,
      cursorColor: resolvedAccent,
      height: 48,
      url: src,
      dragToSeek: true,
      cursorWidth: 2,
      barWidth: 2,
      barGap: 1,
      normalize: true,
    };

    const ws = WaveSurfer.create(options);
    waveSurferRef.current = ws;
    getWaveSurferRef?.(ws);

    bindWaveSurferEvents(ws, {
      mountedRef,
      onReadyInternal: (dur) => {
        setDuration(dur);
        setIsWaveformReady(true);
        ws.setVolume(defaultVolume);
        ws.setPlaybackRate(defaultPlaybackRate);
        if (seekTo && dur > 0) {
          ws.setTime(Math.min(seekTo, dur - 0.1));
        }
      },
      setIsPlaying,
      setCurrentTime,
      setAudioError,
      onReady,
      onDuration,
      onPlay,
      onPause,
      onEnded,
      onError,
      onProgress,
      onSeeked,
    });

    const media = ws.getMediaElement();
    if (media) {
      media.loop = loop;
      if (autoPlay) {
        media.autoplay = true;
      }
    }

    return () => {
      try {
        ws.destroy();
      } catch {
        // ignore
      }
      if (waveSurferRef.current === ws) {
        waveSurferRef.current = null;
      }
    };
  }, [src, accentColor, loop, autoPlay, reloadKey]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  if (audioError) {
    return (
      <div className={cn("w-full", className)} style={containerStyle}>
        <ErrorState message={customErrorMessage} onReload={reloadAudio} />
      </div>
    );
  }

  const disabled = !isWaveformReady || isLoading;

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-2 rounded-lg border bg-card p-3",
        className
      )}
      style={containerStyle}
    >
      <div className="flex items-center gap-2">
        <Button
          aria-label={isPlaying ? "Pause" : "Play"}
          className="rounded-full"
          disabled={disabled}
          onClick={togglePlay}
          size="icon-lg"
          variant="outline"
        >
          {isPlaying ? <Pause /> : <Play />}
        </Button>

        <span className="w-[48px] font-mono text-[11px] text-muted-foreground tabular-nums">
          {disabled ? (
            <Skeleton className="h-4 w-10" />
          ) : (
            formatTime(currentTime)
          )}
        </span>

        <div className="relative h-12 flex-1">
          {isWaveformReady ? null : (
            <div className="absolute inset-0 flex items-center">
              <Skeleton className="h-10 w-full" />
            </div>
          )}
          <div
            aria-label="Audio waveform"
            className={cn(
              "h-full w-full transition-opacity",
              isWaveformReady ? "opacity-100" : "opacity-0"
            )}
            ref={waveformRef}
            role="img"
          />
        </div>

        <span className="w-[48px] text-right font-mono text-[11px] text-muted-foreground tabular-nums">
          {disabled ? (
            <Skeleton className="ml-auto h-4 w-10" />
          ) : (
            formatTime(duration)
          )}
        </span>

        <div className="flex items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                aria-label="Volume"
                disabled={disabled}
                size="icon-sm"
                variant="outline"
              >
                {isMuted ? <VolumeX /> : <Volume2 />}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-48" side="top">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-caption text-muted-foreground">
                    Volume
                  </span>
                  <Button onClick={toggleMute} size="xs" variant="ghost">
                    {isMuted ? "Unmute" : "Mute"}
                  </Button>
                </div>
                <Slider
                  aria-label="Volume"
                  max={1}
                  min={0}
                  onValueChange={([v]) => applyVolume(v)}
                  step={0.05}
                  value={[isMuted ? 0 : volume]}
                />
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                aria-label="Playback speed"
                disabled={disabled}
                size="icon-sm"
                variant="outline"
              >
                <Gauge />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56" side="top">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-caption text-muted-foreground">
                    Playback speed
                  </span>
                  <span className="font-medium font-mono text-caption">
                    {playbackRate.toFixed(2)}x
                  </span>
                </div>
                <Slider
                  aria-label="Playback speed"
                  max={PLAYBACK_RATE_MAX}
                  min={PLAYBACK_RATE_MIN}
                  onValueChange={([speed]) => {
                    const rate = Number(speed.toFixed(2));
                    setPlaybackRate(rate);
                    waveSurferRef.current?.setPlaybackRate(rate);
                    onPlaybackRateChange?.(rate);
                  }}
                  step={PLAYBACK_RATE_STEP}
                  value={[playbackRate]}
                />
              </div>
            </PopoverContent>
          </Popover>

          {showDownloadButton ? (
            <Button
              aria-label="Download audio"
              disabled={disabled || isDownloading}
              onClick={handleDownloadClick}
              size="icon-sm"
              variant="outline"
            >
              <Download />
            </Button>
          ) : null}
        </div>
      </div>

      {showSearchRow ? (
        <>
          <Separator />
          <div className="flex items-center gap-2">
            {onSearch ? (
              <InputGroup className="flex-1">
                <InputGroupAddon>
                  <Search className="size-3.5 text-muted-foreground" />
                </InputGroupAddon>
                <InputGroupInput
                  onChange={(e) => onSearch(e.target.value)}
                  placeholder="Search transcript"
                  value={search ?? ""}
                />
                {enableTranscriptNavigation && searchMatchCount ? (
                  <InputGroupAddon align="inline-end">
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {searchMatchCount.current}/{searchMatchCount.total}
                    </span>
                    <Button
                      aria-label="Previous match"
                      onClick={onPrevious}
                      size="icon-sm"
                      variant="ghost"
                    >
                      <ChevronUp className="size-3" />
                    </Button>
                    <Button
                      aria-label="Next match"
                      onClick={onNext}
                      size="icon-sm"
                      variant="ghost"
                    >
                      <ChevronDown className="size-3" />
                    </Button>
                  </InputGroupAddon>
                ) : null}
              </InputGroup>
            ) : null}

            {onCopyTranscript ? (
              <Button
                aria-label="Copy transcript"
                onClick={onCopyTranscript}
                size="icon-sm"
                variant="outline"
              >
                <Copy />
              </Button>
            ) : null}
            {onDownloadTranscript ? (
              <Button
                aria-label="Download transcript"
                onClick={onDownloadTranscript}
                size="icon-sm"
                variant="outline"
              >
                <FileDown />
              </Button>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
});
