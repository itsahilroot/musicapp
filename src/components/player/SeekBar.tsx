interface SeekBarProps {
  played: number;
  duration: number;
  progressPercent: number;
  onSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMouseMove?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave?: () => void;
  hoverTime: number | null;
  hoverLeft: number;
  formatTime: (s: number) => string;
}

export function SeekBar({
  played,
  duration,
  progressPercent,
  onSeek,
  onMouseMove,
  onMouseLeave,
  hoverTime,
  hoverLeft,
  formatTime,
}: SeekBarProps) {
  return (
    <div
      className="absolute top-0 left-0 right-0 h-[3px] bg-white/8 cursor-pointer z-10 group"
      onClick={(e) => e.stopPropagation()}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <input
        type="range"
        min={0}
        max={duration || 1}
        step={0.1}
        value={played}
        onChange={onSeek}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
      />
      <div
        className="absolute top-0 left-0 bottom-0 bg-accent rounded-r-full"
        style={{ width: `${progressPercent}%`, transition: 'width 0.1s linear' }}
      />
      {hoverTime !== null && (
        <div
          className="absolute bottom-5 -translate-x-1/2 bg-bg-card text-text-primary text-[11px] px-2 py-1 rounded-lg shadow-xl font-medium pointer-events-none border border-border"
          style={{ left: hoverLeft }}
        >
          {formatTime(hoverTime)}
        </div>
      )}
    </div>
  );
}
