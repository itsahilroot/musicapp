import { Play, Disc3, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn, getHighResCover } from '../../lib/utils';
import { handleImageError } from '../../lib/image-fallback';
import { CoverImage } from './CoverImage';

interface MusicCardProps {
  item: any;
  onPlay: (item: any) => void;
  isActive?: boolean;
  isLiked?: boolean;
  onToggleLike?: (item: any) => void;
}

export function MusicCard({ item, onPlay, isActive, isLiked, onToggleLike }: MusicCardProps) {
  const coverUrl = getHighResCover(item.thumbnails?.[item.thumbnails.length - 1]?.url);
  const artist = item.artists?.map((a: any) => a.name).join(', ') || (item.playlistId ? 'Playlist' : 'Album');

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="flex flex-col gap-2 cursor-pointer group"
      onClick={() => onPlay(item)}
    >
      <div className={cn(
        "relative w-full aspect-square rounded-2xl overflow-hidden bg-bg-card",
        isActive && "ring-2 ring-accent ring-offset-2 ring-offset-bg"
      )}>
        <CoverImage
          src={coverUrl}
          alt={item.title}
          className="w-full h-full"
          imgClassName="group-hover:scale-105 transition-transform duration-700 will-change-transform"
          onError={(e) => handleImageError(e, item.title, item.videoId)}
        />

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-between p-3">
          <div className={cn(
            "w-10 h-10 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent/30",
            "translate-y-2 group-hover:translate-y-0 transition-transform duration-200"
          )}>
            {isActive ? <Disc3 size={18} className="animate-spin text-white" /> : <Play size={18} fill="white" className="ml-0.5 text-white" />}
          </div>

          {onToggleLike && (
            <button
              className="p-2 rounded-full bg-white/10 backdrop-blur-sm translate-y-2 group-hover:translate-y-0 transition-transform duration-300"
              onClick={(e) => { e.stopPropagation(); onToggleLike(item); }}
            >
              <Heart size={16} className={cn(isLiked ? "fill-accent text-accent" : "text-white/80")} />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col px-0.5 min-w-0">
        <span className={cn("font-medium text-[13px] leading-snug line-clamp-1", isActive ? "text-accent" : "text-text-primary")}>
          {item.title}
        </span>
        <span className="text-[11px] text-text-muted line-clamp-1 mt-0.5">{artist}</span>
      </div>
    </motion.div>
  );
}
