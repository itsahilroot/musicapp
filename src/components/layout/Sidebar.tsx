import { Home, Heart, Radio, Music, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface SidebarProps {
  onGoHome: () => void;
  onClose: () => void;
  onShowLiked: () => void;
  likedCount: number;
}

export function Sidebar({ onGoHome, onClose, onShowLiked, likedCount }: SidebarProps) {
  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      exit={{ x: -280 }}
      transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
      className={cn(
        "fixed inset-y-0 left-0 z-40 w-[260px] flex flex-col bg-bg-elevated border-r border-border",
        "md:relative md:translate-x-0"
      )}
    >
      <div className="flex items-center gap-3 px-5 h-16">
        <div className="w-8 h-8 rounded-xl bg-accent/20 flex items-center justify-center">
          <Music size={16} className="text-accent" />
        </div>
        <span className="font-bold text-base tracking-tight text-text-primary">Musicfy</span>
        <button className="ml-auto md:hidden p-2 rounded-full hover:bg-bg-card transition-colors" onClick={onClose}>
          <X size={16} className="text-text-muted" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-3">
        <p className="px-3 text-[10px] font-bold text-text-muted/60 uppercase tracking-[0.15em] mb-2">Menu</p>
        <NavItem icon={<Home size={18} />} label="Home" onClick={onGoHome} />
        <NavItem icon={<Radio size={18} />} label="Explore" />

        <p className="px-3 text-[10px] font-bold text-text-muted/60 uppercase tracking-[0.15em] mb-2 mt-5">Your Music</p>
        <NavItem
          icon={<Heart size={18} />}
          label="Liked Songs"
          onClick={onShowLiked}
          badge={likedCount > 0 ? likedCount : undefined}
        />
      </nav>
    </motion.aside>
  );
}

function NavItem({ icon, label, onClick, badge }: { icon: React.ReactNode; label: string; onClick?: () => void; badge?: number }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-bg-card transition-colors text-sm font-medium text-text-primary group"
    >
      <span className="text-text-muted group-hover:text-accent transition-colors">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {badge !== undefined && (
        <span className="text-[10px] font-bold bg-accent/20 text-accent px-2 py-0.5 rounded-full">{badge}</span>
      )}
    </button>
  );
}
