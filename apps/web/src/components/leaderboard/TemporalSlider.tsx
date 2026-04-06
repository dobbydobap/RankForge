'use client';

interface TemporalSliderProps {
  duration: number;
  value: number;
  onChange: (minute: number) => void;
  isPlaying?: boolean;
  onPlayToggle?: () => void;
}

export function TemporalSlider({
  duration,
  value,
  onChange,
  isPlaying,
  onPlayToggle,
}: TemporalSliderProps) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  const timeLabel = hours > 0
    ? `${hours}h ${minutes}m`
    : `${minutes}m`;

  return (
    <div className="flex items-center gap-4">
      {onPlayToggle && (
        <button
          onClick={onPlayToggle}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-zinc-700 hover:border-emerald-500 text-zinc-400 hover:text-emerald-400 transition-colors"
        >
          {isPlaying ? (
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </button>
      )}

      <div className="flex-1 flex items-center gap-3">
        <span className="text-xs text-zinc-500 w-8 text-right">0m</span>
        <input
          type="range"
          min={0}
          max={duration}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="flex-1 h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-emerald-500
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:shadow-lg"
        />
        <span className="text-xs text-zinc-500 w-12">
          {Math.floor(duration / 60)}h {duration % 60}m
        </span>
      </div>

      <div className="px-3 py-1 bg-zinc-900 border border-zinc-700 rounded-lg">
        <span className="text-sm font-mono text-emerald-400">{timeLabel}</span>
      </div>
    </div>
  );
}
