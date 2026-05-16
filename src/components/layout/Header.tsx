import { Search, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  query: string;
  suggestions: string[];
  showSuggestions: boolean;
  onQueryChange: (value: string) => void;
  onSearch: (e: React.FormEvent) => void;
  onSuggestionClick: (sug: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onMenuClick: () => void;
}

export function Header({
  query,
  suggestions,
  showSuggestions,
  onQueryChange,
  onSearch,
  onSuggestionClick,
  onFocus,
  onBlur,
  onMenuClick,
}: HeaderProps) {
  return (
    <header className="h-16 flex items-center gap-3 px-4 md:px-6 bg-background/80 backdrop-blur-xl z-20 sticky top-0 border-b border-text-secondary/5 shrink-0">
      <button
        className="md:hidden p-2 rounded-full hover:bg-surface-hover transition-colors text-text"
        onClick={onMenuClick}
      >
        <Menu size={22} />
      </button>

      <div className="flex-1 max-w-lg">
        <form className="relative group" onSubmit={onSearch}>
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search size={16} className="text-text-secondary group-focus-within:text-accent transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search songs, artists, albums..."
            className="w-full bg-surface hover:bg-surface-hover focus:bg-surface border border-transparent focus:border-accent/20 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
          />

          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 right-0 mt-1.5 bg-surface border border-text-secondary/10 rounded-xl shadow-xl overflow-hidden z-50"
              >
                {suggestions.map((sug, i) => (
                  <div
                    key={i}
                    className="px-4 py-2.5 cursor-pointer flex items-center gap-3 hover:bg-surface-hover transition-colors text-sm text-text"
                    onClick={() => onSuggestionClick(sug)}
                  >
                    <Search size={14} className="text-text-secondary shrink-0" />
                    <span className="truncate">{sug}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </header>
  );
}
