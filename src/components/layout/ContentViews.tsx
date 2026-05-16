import { ArrowLeft, Play, Disc3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn, getHighResCover } from '../../lib/utils';
import { handleImageError } from '../../lib/image-fallback';
import { CoverImage } from '../ui/CoverImage';
import { Skeleton } from '../ui/Skeleton';
import { MusicCard } from '../ui/MusicCard';

interface AlbumViewProps {
  albumView: { title: string; tracks: any[]; cover?: string };
  currentSongId?: string;
  onBack: () => void;
  onPlayItem: (item: any) => void;
  isLiked?: (videoId: string) => boolean;
  onToggleLike?: (item: any) => void;
}

export function AlbumView({ albumView, currentSongId, onBack, onPlayItem }: AlbumViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25 }}
      className="max-w-4xl mx-auto flex flex-col gap-6"
    >
      <button
        className="flex items-center gap-2 text-text-secondary hover:text-text w-max transition-colors text-sm font-medium active:scale-95"
        onClick={onBack}
      >
        <ArrowLeft size={18} /> Back
      </button>

      <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-end">
        <CoverImage
          src={getHighResCover(albumView.cover || '')}
          alt={albumView.title}
          className="w-52 h-52 sm:w-56 sm:h-56 rounded-2xl shadow-xl shrink-0"
          onError={(e) => handleImageError(e, albumView.title)}
        />
        <div className="flex flex-col gap-2 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text leading-tight">
            {albumView.title}
          </h1>
          <p className="text-text-secondary text-sm font-medium">{albumView.tracks.length} tracks</p>
          <button
            className="mt-3 bg-accent hover:bg-accent/90 text-white py-2.5 px-7 rounded-full font-semibold text-sm flex items-center justify-center gap-2 w-max mx-auto sm:mx-0 active:scale-95 transition-transform shadow-md"
            onClick={() => {
              if (albumView.tracks.length > 0) onPlayItem(albumView.tracks[0]);
            }}
          >
            <Play size={18} fill="currentColor" /> Play All
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-0.5 mt-2">
        {albumView.tracks.map((track, i) => {
          const isActive = currentSongId === track.videoId;
          return (
            <div
              key={i}
              onClick={() => onPlayItem(track)}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors group",
                isActive ? "bg-accent/8" : "hover:bg-surface-hover"
              )}
            >
              <span className={cn(
                "w-7 text-center text-xs font-medium tabular-nums",
                isActive ? "text-accent" : "text-text-secondary"
              )}>
                {isActive ? <Disc3 size={14} className="animate-spin text-accent mx-auto" /> : i + 1}
              </span>
              <div className="flex flex-col flex-1 min-w-0">
                <span className={cn(
                  "font-medium text-sm line-clamp-1",
                  isActive ? "text-accent" : "text-text"
                )}>
                  {track.title}
                </span>
                <span className="text-xs text-text-secondary line-clamp-1">
                  {track.artists?.map((a: any) => a.name).join(', ')}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

interface HomeContentProps {
  homeData: any[];
  homeLoading: boolean;
  results: any[];
  query: string;
  currentSongId?: string;
  onPlayItem: (item: any) => void;
  isLiked?: (videoId: string) => boolean;
  onToggleLike?: (item: any) => void;
}

export function HomeContent({ homeData, homeLoading, results, query, currentSongId, onPlayItem, isLiked, onToggleLike }: HomeContentProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-8"
    >
      {/* Search results */}
      {query && results.length > 0 && (
        <div className="flex flex-col gap-5">
          <h2 className="text-xl font-bold tracking-tight text-text">Search Results</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
            {results.map((song, i) => (
              <MusicCard
                key={i}
                item={song}
                onPlay={onPlayItem}
                isActive={currentSongId === song.videoId}
                isLiked={isLiked?.(song.videoId)}
                onToggleLike={onToggleLike}
              />
            ))}
          </div>
        </div>
      )}

      {/* Home shelves */}
      {!query && homeLoading ? (
        <div className="flex flex-col gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-4">
              <Skeleton className="w-40 h-6" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
                {[1, 2, 3, 4, 5, 6].map((j) => (
                  <div key={j} className="flex flex-col gap-2.5">
                    <Skeleton className="w-full aspect-square rounded-xl" />
                    <Skeleton className="w-3/4 h-3.5" />
                    <Skeleton className="w-1/2 h-3" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        !query &&
        homeData.map(
          (shelf, idx) =>
            shelf.contents &&
            shelf.contents.length > 0 && (
              <div key={idx} className="flex flex-col gap-4">
                <h2 className="text-xl font-bold tracking-tight text-text">{shelf.title}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
                  {shelf.contents.map((item: any, i: number) => (
                    <MusicCard
                      key={i}
                      item={item}
                      onPlay={onPlayItem}
                      isActive={currentSongId === item.videoId}
                      isLiked={isLiked?.(item.videoId)}
                      onToggleLike={onToggleLike}
                    />
                  ))}
                </div>
              </div>
            )
        )
      )}
    </motion.div>
  );
}

export function LoadingSpinner() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full py-24 flex flex-col items-center justify-center gap-3"
    >
      <div className="w-9 h-9 border-[3px] border-accent/20 border-t-accent rounded-full animate-spin" />
      <p className="text-text-secondary text-sm font-medium">Loading...</p>
    </motion.div>
  );
}
