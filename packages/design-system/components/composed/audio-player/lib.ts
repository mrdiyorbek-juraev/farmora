export function formatTime(seconds: number): string {
  const isNegative = seconds < 0;
  const abs = Math.abs(seconds);
  const hrs = Math.floor(abs / 3600);
  const mins = Math.floor((abs % 3600) / 60);
  const secs = Math.floor(abs % 60);
  const formatted =
    hrs === 0
      ? `${mins}:${String(secs).padStart(2, "0")}`
      : `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  return isNegative && formatted !== "0:00" ? `-${formatted}` : formatted;
}

export const PLAYBACK_RATE_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
