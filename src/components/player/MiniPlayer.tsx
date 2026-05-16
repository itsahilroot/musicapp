import { Play, Pause, SkipForward, SkipBack, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTime } from '../../lib/utils';
import { handleImageError } from '../../lib/image-fallback';
import { CoverImage } from '../ui/CoverImage';
import { SeekBar } from './SeekBar';

interface MiniPlayerProps {
  currentSong: any;
  currentCover: string;
  isPlaying: boolean;
  played: number;
  duration: number;
  progressPercent: number;
  hoverTime: number | null;
  hoverLeft: number;
  isLiked: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTimelineMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  onTimelineMouseLeave: () => void;
  onExpand: () => void;
  onWheel: (e: React.WheelEvent) => void;
  onToggleLike: () => void;
}

export function MiniPlayer({
  currentSong,
  currentCover,
  isPlaying,
  played,
  duration,
  progressPercent,
  hoverTime,
  hoverLeft,
  isLiked,
  onPlayPause,
  onNext,
  onPrev,
  onSeek,
  onTimelineMouseMove,
  onTimelineMouseLeave,
  onExpand,
  onWheel,
  onToggleLike,
}: MiniPlayerProps) {
  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      transition={{ type: 'spring', damping: 24, stiffness: 300 }}
      className="fixed bottom-0 left-0 right-0 z-60 cursor-pointer"
      onClick={onExpand}
      onWheel={onWheel}
    >
      <div className="glass border-t border-border">
        <SeekBar
          played={played}
          duration={duration}
          progressPercent={progressPercent}
          onSeek={onSeek}
          onMouseMove={onTimelineMouseMove}
          onMouseLeave={onTimelineMouseLeave}
          hoverTime={hoverTime}
          hoverLeft={hoverLeft}
          formatTime={formatTime}
        />

        <div className="flex items-center gap-3 px-4 py-2.5">
          {/* Cover */}
          <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-lg shadow-black/30">
            <CoverImage
              src={currentCover}
              alt={currentSong.title}
              className="w-full h-full"
              onError={(e) => handleImageError(e, currentSong.title, currentSong.videoId)}
            />
            <AnimatePresence>
              {isPlaying && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/30 flex items-center justify-center"
                >
                  <div className="flex gap-[3px] items-end h-3">
                    {[0.7, 0.9, 0.6].map((d, i) => (
                      <motion.div
                        key={i}
                        animate={{ scaleY: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: d, delay: i * 0.12, ease: 'easeInOut' }}
                        className="w-[3px] h-full bg-accent rounded-full origin-bottom"
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Info */}
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-semibold text-[13px] text-text-primary truncate">{currentSong.title}</span>
            <span className="text-[11px] text-text-muted truncate">{currentSong.artists?.map((a: any) => a.name).join(', ')}</span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <button className="p-2 text-text-muted hover:text-text-primary transition-colors active:scale-90 hidden sm:block" onClick={onToggleLike}>
              <Heart size={18} className={isLiked ? "fill-accent text-accent" : ""} />
            </button>
            <button className="hidden md:block p-2 text-text-muted hover:text-text-primary transition-colors active:scale-90" onClick={onPrev}>
              <SkipBack size={18} fill="currentColor" />
            </button>
            <button
              className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center active:scale-90 transition-transform ml-1"
              onClick={onPlayPause}
            >
              {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
            </button>
            <button className="p-2 text-text-muted hover:text-text-primary transition-colors active:scale-90" onClick={onNext}>
              <SkipForward size={18} fill="currentColor" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
