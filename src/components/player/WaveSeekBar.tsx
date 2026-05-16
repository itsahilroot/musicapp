import { useMemo, useCallback } from 'react';

interface WaveSeekBarProps {
  played: number;
  duration: number;
  isPlaying: boolean;
  onSeek: (time: number) => void;
}

const BAR_COUNT = 60;

export function WaveSeekBar({ played, duration, isPlaying, onSeek }: WaveSeekBarProps) {
  // Generate consistent random bar heights based on duration (deterministic per song)
  const barHeights = useMemo(() => {
    const heights: number[] = [];
    // Use a simple seed from duration so bars change per song
    let seed = Math.floor((duration || 180) * 1000);
    for (let i = 0; i < BAR_COUNT; i++) {
      seed = (seed * 16807 + 7) % 2147483647;
      const normalized = (seed % 1000) / 1000;
      // Create a wave-like pattern with random variation
      const wave = Math.sin((i / BAR_COUNT) * Math.PI * 3) * 0.3;
      heights.push(0.15 + normalized * 0.55 + Math.abs(wave) * 0.3);
    }
    return heights;
  }, [duration]);

  const progressFraction = duration > 0 ? played / duration : 0;

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const fraction = Math.max(0, Math.min(1, x / rect.width));
    onSeek(fraction * duration);
  }, [duration, onSeek]);

  return (
    <div
      className="w-full h-12 flex items-end gap-[2px] cursor-pointer group relative select-none"
      onClick={handleClick}
    >
      {barHeights.map((h, i) => {
        const barFraction = i / BAR_COUNT;
        const isPast = barFraction <= progressFraction;
        const isCurrent = Math.abs(barFraction - progressFraction) < 1 / BAR_COUNT;

        return (
          <div
            key={i}
            className="wave-bar flex-1 rounded-full relative"
            style={{
              height: `${h * 100}%`,
              background: isPast
                ? 'linear-gradient(to top, var(--color-accent), var(--color-accent-glow))'
                : 'rgba(255,255,255,0.08)',
              opacity: isPast ? 1 : 0.6,
              transform: isCurrent && isPlaying ? 'scaleY(1.15)' : 'scaleY(1)',
              transformOrigin: 'bottom',
              boxShadow: isCurrent && isPlaying ? '0 0 8px var(--color-accent-glow)' : 'none',
            }}
          />
        );
      })}

      {/* Hover glow line */}
      <div
        className="absolute bottom-0 h-full w-[2px] bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ left: `${progressFraction * 100}%` }}
      />
    </div>
  );
}
