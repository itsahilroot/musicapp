import { Play, Pause, SkipForward, SkipBack, ChevronDown, Repeat, Repeat1, Volume2, VolumeX, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn, formatTime } from '../../lib/utils';
import { handleImageError } from '../../lib/image-fallback';
import { CoverImage } from '../ui/CoverImage';
import { WaveSeekBar } from './WaveSeekBar';

interface FullPlayerProps {
  currentSong: any;
  currentCover: string;
  isPlaying: boolean;
  played: number;
  duration: number;
  volume: number;
  repeatMode: 0 | 1 | 2;
  activeTab: 'poster' | 'lyrics';
  lyrics: string;
  syncedLyrics: { time: number; text: string }[];
  isSynced: boolean;
  lyricsLoading: boolean;
  isLiked: boolean;
  lyricsContainerRef: React.RefObject<HTMLDivElement | null>;
  playerRef: React.RefObject<any>;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
  onSetPlayed: (time: number) => void;
  onToggleRepeat: () => void;
  onSetVolume: (vol: number) => void;
  onSetActiveTab: (tab: 'poster' | 'lyrics') => void;
  onClose: () => void;
  onToggleLike: () => void;
}

export function FullPlayer({
  currentSong,
  currentCover,
  isPlaying,
  played,
  duration,
  volume,
  repeatMode,
  activeTab,
  lyrics,
  syncedLyrics,
  isSynced,
  lyricsLoading,
  isLiked,
  lyricsContainerRef,
  playerRef,
  onPlayPause,
  onNext,
  onPrev,
  onSeek,
  onSetPlayed,
  onToggleRepeat,
  onSetVolume,
  onSetActiveTab,
  onClose,
  onToggleLike,
}: FullPlayerProps) {
  const handleWaveSeek = (time: number) => {
    onSetPlayed(time);
    onSeek(time);
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 250 }}
      className="fixed inset-0 z-100 flex flex-col overflow-hidden bg-bg"
    >
      {/* Ambient glow from cover */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-[-30%] bg-cover bg-center blur-[140px] opacity-25 scale-150 saturate-150"
          style={{ backgroundImage: `url(${currentCover})` }}
        />
        <div className="absolute inset-0 bg-linear-to-b from-bg/30 via-bg/80 to-bg" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
        <button
          className="w-10 h-10 rounded-full bg-white/6 hover:bg-white/12 flex items-center justify-center text-text-primary transition-colors active:scale-90"
          onClick={onClose}
        >
          <ChevronDown size={24} />
        </button>

        <div className="flex bg-white/6 p-1 rounded-full">
          {(['poster', 'lyrics'] as const).map((tab) => (
            <button
              key={tab}
              className={cn(
                "px-5 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-200",
                activeTab === tab
                  ? 'bg-accent text-white shadow-md shadow-accent/20'
                  : 'text-text-muted hover:text-text-primary'
              )}
              onClick={() => onSetActiveTab(tab)}
            >
              {tab === 'poster' ? 'Now Playing' : 'Lyrics'}
            </button>
          ))}
        </div>

        <button
          className="w-10 h-10 rounded-full bg-white/6 hover:bg-white/12 flex items-center justify-center transition-colors active:scale-90"
          onClick={onToggleLike}
        >
          <Heart size={20} className={cn(isLiked ? "fill-accent text-accent" : "text-text-muted")} />
        </button>
      </div>

      {/* Content — BOTH tabs rendered, visibility toggled to prevent image reload */}
      <div className="relative z-10 flex-1 overflow-hidden flex flex-col min-h-0">
        {/* Poster tab */}
        <div className={cn("flex-1 flex flex-col items-center justify-center px-8", activeTab !== 'poster' && "hidden")}>
          <motion.div
            key={currentSong.videoId + '-cover'}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0.25, duration: 0.6 }}
            className="w-full max-w-[280px] md:max-w-[360px] aspect-square rounded-3xl overflow-hidden shadow-2xl shadow-black/50"
          >
            <CoverImage
              src={currentCover}
              alt={currentSong.title}
              className="w-full h-full"
              onError={(e) => handleImageError(e, currentSong.title, currentSong.videoId)}
            />
          </motion.div>
        </div>

        {/* Lyrics tab */}
        <div
          className={cn("flex-1 overflow-y-auto no-scrollbar px-6 flex flex-col items-center text-center", activeTab !== 'lyrics' && "hidden")}
          ref={lyricsContainerRef}
        >
          <div className="max-w-2xl w-full mx-auto py-20">
            {lyricsLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-7 h-7 border-[3px] border-accent/30 border-t-accent rounded-full animate-spin" />
              </div>
            ) : isSynced ? (
              syncedLyrics.map((line, i) => {
                const isActive = played >= line.time && (i === syncedLyrics.length - 1 || played < syncedLyrics[i + 1].time);
                return (
                  <p
                    key={i}
                    className={cn(
                      "lyrics-line text-lg md:text-2xl font-bold py-2 transition-all duration-300 cursor-pointer leading-snug",
                      isActive
                        ? "active text-text-primary scale-[1.06] origin-center"
                        : "text-white/20 hover:text-white/45"
                    )}
                    onClick={() => {
                      if (playerRef.current) {
                        playerRef.current.seekTo(line.time, true);
                        onSetPlayed(line.time);
                      }
                    }}
                  >
                    {line.text || '\u00A0'}
                  </p>
                );
              })
            ) : (
              lyrics.split('\n').map((line, i) => (
                <p key={i} className="text-base md:text-xl font-semibold py-1.5 text-white/50 leading-relaxed">
                  {line || '\u00A0'}
                </p>
              ))
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="shrink-0 px-6 md:px-10 pb-8 pt-3 flex flex-col gap-4 max-w-xl w-full mx-auto">
          {/* Song title */}
          <div className="flex flex-col text-center min-w-0">
            <h2 className="text-lg md:text-xl font-bold truncate text-text-primary">{currentSong.title}</h2>
            <p className="text-sm text-text-muted truncate">{currentSong.artists?.map((a: any) => a.name).join(', ')}</p>
          </div>

          {/* Wave Seek Bar */}
          <WaveSeekBar
            played={played}
            duration={duration}
            isPlaying={isPlaying}
            onSeek={handleWaveSeek}
          />
          <div className="flex justify-between text-[11px] font-medium text-text-muted tabular-nums -mt-2">
            <span>{formatTime(played)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          {/* Transport */}
          <div className="flex items-center justify-between mt-1">
            <button className="p-2 text-text-muted hover:text-text-primary transition-colors active:scale-90" onClick={onToggleRepeat}>
              {repeatMode === 2 ? <Repeat1 size={20} className="text-accent" /> :
               repeatMode === 1 ? <Repeat size={20} className="text-accent" /> :
               <Repeat size={20} />}
            </button>

            <div className="flex items-center gap-5 md:gap-7">
              <button className="p-2 text-text-primary hover:scale-110 active:scale-90 transition-transform" onClick={onPrev}>
                <SkipBack size={26} fill="currentColor" />
              </button>
              <button
                className="w-16 h-16 rounded-full bg-accent text-white flex items-center justify-center hover:scale-[1.04] active:scale-95 transition-transform shadow-xl shadow-accent/30"
                onClick={onPlayPause}
              >
                {isPlaying ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" className="ml-1" />}
              </button>
              <button className="p-2 text-text-primary hover:scale-110 active:scale-90 transition-transform" onClick={onNext}>
                <SkipForward size={26} fill="currentColor" />
              </button>
            </div>

            <div className="relative group">
              <button className="p-2 text-text-muted hover:text-text-primary transition-colors" onClick={() => onSetVolume(volume === 0 ? 0.5 : 0)}>
                {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-bg-card p-3 rounded-xl shadow-2xl border border-border opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity flex flex-col items-center gap-3">
                <span className="text-[11px] font-semibold text-text-primary tabular-nums">{Math.round(volume * 100)}%</span>
                <div className="h-20 w-4 relative flex justify-center">
                  <input
                    type="range" min={0} max={1} step={0.01} value={volume}
                    onChange={(e) => onSetVolume(parseFloat(e.target.value))}
                    className="styled-slider -rotate-90 absolute top-1/2 -translate-y-1/2 w-20"
                    style={{ '--val': `${volume * 100}%` } as any}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
