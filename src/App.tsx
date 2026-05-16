import { useState, useEffect, useRef } from 'react';
import YouTube from 'react-youtube';
import { AnimatePresence, motion } from 'framer-motion';
import './index.css';

import { getHome, getSuggestions, searchMusic, getRelated, getPlaylist, getLyrics } from './api-client';
import { getHighResCover } from './lib/utils';

import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { AlbumView, HomeContent, LoadingSpinner } from './components/layout/ContentViews';
import { MiniPlayer } from './components/player/MiniPlayer';
import { FullPlayer } from './components/player/FullPlayer';
import { useRecentlyPlayed, useLikedSongs } from './hooks/usePlayerStorage';

function App() {
    // App Theme setup - default to dark
    useEffect(() => {
        document.documentElement.classList.add('dark');
    }, []);

    // Sidebar
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [viewState, setViewState] = useState<'home' | 'liked'>('home');

    // Storage
    const { recent, addRecent } = useRecentlyPlayed();
    const { liked, toggleLike, isLiked } = useLikedSongs();

    // Search
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Player
    const [currentSong, setCurrentSong] = useState<any | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const [played, setPlayed] = useState(0);
    const [duration, setDuration] = useState(0);
    const [repeatMode, setRepeatMode] = useState<0 | 1 | 2>(0);

    // Full Player
    const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'poster' | 'lyrics'>('poster');
    const [lyrics, setLyrics] = useState<string>('');
    const [syncedLyrics, setSyncedLyrics] = useState<{ time: number; text: string }[]>([]);
    const [isSynced, setIsSynced] = useState(false);
    const [lyricsLoading, setLyricsLoading] = useState(false);

    // Timeline hover
    const [hoverTime, setHoverTime] = useState<number | null>(null);
    const [hoverLeft, setHoverLeft] = useState<number>(0);

    // Data
    const [homeData, setHomeData] = useState<any[]>([]);
    const [homeLoading, setHomeLoading] = useState(true);
    const [relatedSongs, setRelatedSongs] = useState<any[]>([]);
    const [albumView, setAlbumView] = useState<{ title: string; tracks: any[]; cover?: string } | null>(null);

    // Refs
    const playerRef = useRef<any>(null);
    const lyricsContainerRef = useRef<HTMLDivElement>(null);

    // ── Data Fetching ──────────────────────────────────────────────

    useEffect(() => {
        const fetchHome = async () => {
            setHomeLoading(true);
            try {
                const data = await getHome();
                if (data.home) setHomeData(data.home);
            } catch (err) {
                console.error('Failed to fetch home data', err);
            } finally {
                setHomeLoading(false);
            }
        };
        fetchHome();
    }, []);

    useEffect(() => {
        if (query.trim().length > 1) {
            const delay = setTimeout(async () => {
                try {
                    const data = await getSuggestions(query);
                    setSuggestions(data.suggestions || []);
                } catch (err) {
                    console.error('Failed to fetch suggestions', err);
                }
            }, 300);
            return () => clearTimeout(delay);
        } else {
            setSuggestions([]);
        }
    }, [query]);

    useEffect(() => {
        if (currentSong) {
            setPlayed(0);
            setDuration(0);
            setIsPlaying(true);
            setLyrics('');
            setSyncedLyrics([]);
            setIsSynced(false);
            setLyricsLoading(true);

            const fetchSongData = async () => {
                try {
                    const artist = currentSong.artists?.[0]?.name || '';
                    const title = currentSong.title || '';
                    const lyricsData = await getLyrics(currentSong.videoId, title, artist);

                    if (lyricsData.synced && lyricsData.lyrics) {
                        setIsSynced(true);
                        const lines = lyricsData.lyrics
                            .split('\n')
                            .map((line: string) => {
                                const match = line.match(/\[(\d+):(\d+(?:\.\d+)?)\](.*)/);
                                if (match) {
                                    return {
                                        time: parseInt(match[1]) * 60 + parseFloat(match[2]),
                                        text: match[3].trim(),
                                    };
                                }
                                return null;
                            })
                            .filter(Boolean);
                        setSyncedLyrics(lines as any);
                    } else {
                        setLyrics(lyricsData.lyrics || 'Lyrics not available.');
                    }

                    if (!albumView) {
                        const relatedData = await getRelated(currentSong.videoId);
                        if (relatedData.related) setRelatedSongs(relatedData.related);
                    }
                } catch (error) {
                    console.error('Failed to fetch song data:', error);
                    setLyrics('Lyrics not available.');
                } finally {
                    setLyricsLoading(false);
                }
            };

            fetchSongData();
        }
    }, [currentSong, albumView]);

    // ── Player Control Effects ─────────────────────────────────────

    useEffect(() => {
        if (playerRef.current) {
            playerRef.current.setVolume(volume * 100);
            if (isPlaying) {
                playerRef.current.playVideo();
            } else {
                playerRef.current.pauseVideo();
            }
        }
    }, [isPlaying, volume]);

    useEffect(() => {
        let interval: any;
        if (isPlaying) {
            interval = setInterval(async () => {
                try {
                    if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
                        const time = await Promise.resolve(playerRef.current.getCurrentTime());
                        setPlayed(time);
                        const dur = await Promise.resolve(playerRef.current.getDuration());
                        if (dur > 0) setDuration(dur);
                    }
                } catch (_) { }
            }, 500);
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

    useEffect(() => {
        if (isSynced && activeTab === 'lyrics' && lyricsContainerRef.current) {
            const activeLine = document.querySelector('.lyrics-line.active');
            if (activeLine) {
                activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [played, isSynced, activeTab]);

    // ── Player Actions ─────────────────────────────────────────────

    const handleSongEnd = () => {
        if (repeatMode === 2) {
            if (playerRef.current) {
                playerRef.current.seekTo(0);
                playerRef.current.playVideo();
            }
        } else {
            playNext();
        }
    };

    const playNext = () => {
        const listToUse = albumView ? albumView.tracks : relatedSongs.length > 0 ? relatedSongs : results;
        if (!currentSong || listToUse.length === 0) return;
        const currentIndex = listToUse.findIndex((s) => s.videoId === currentSong.videoId);
        if (currentIndex !== -1 && currentIndex < listToUse.length - 1) {
            setCurrentSong(listToUse[currentIndex + 1]);
        } else if (repeatMode === 1 && listToUse.length > 0) {
            setCurrentSong(listToUse[0]);
        }
    };

    const playPrev = () => {
        const listToUse = albumView ? albumView.tracks : relatedSongs.length > 0 ? relatedSongs : results;
        if (!currentSong || listToUse.length === 0) return;
        const currentIndex = listToUse.findIndex((s) => s.videoId === currentSong.videoId);
        if (currentIndex > 0) {
            setCurrentSong(listToUse[currentIndex - 1]);
        }
    };

    // ── Search / Navigation ────────────────────────────────────────

    const executeSearch = async (searchQuery: string) => {
        if (!searchQuery) return;
        setQuery(searchQuery);
        setShowSuggestions(false);
        setLoading(true);
        setAlbumView(null);
        try {
            const data = await searchMusic(searchQuery);
            setResults(data.results || []);
        } catch (error) {
            console.error('Failed to search', error);
        } finally {
            setLoading(false);
        }
    };

    const searchMusicHandler = (e: React.FormEvent) => {
        e.preventDefault();
        executeSearch(query);
    };

    const handleItemClick = async (item: any) => {
        if (item.videoId) {
            setCurrentSong(item);
            addRecent(item);
            setIsFullPlayerOpen(true);
        } else if (item.playlistId || item.browseId) {
            const id = item.playlistId || item.browseId;
            setLoading(true);
            try {
                const data = await getPlaylist(id);
                if (data.tracks) {
                    setAlbumView({
                        title: data.title || item.title,
                        tracks: data.tracks,
                        cover: item.thumbnails?.[item.thumbnails.length - 1]?.url,
                    });
                } else {
                    console.error('Failed to load playlist or album');
                }
                setResults([]);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
    };

    // ── Seek / Timeline ────────────────────────────────────────────

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setPlayed(val);
        if (playerRef.current) {
            playerRef.current.seekTo(val, true);
        }
    };

    const handleTimeSeek = (time: number) => {
        setPlayed(time);
        if (playerRef.current) {
            playerRef.current.seekTo(time, true);
        }
    };

    const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        setHoverTime(percentage * duration);
        setHoverLeft(x);
    };

    const handleTimelineMouseLeave = () => setHoverTime(null);

    const toggleRepeat = () => setRepeatMode((prev) => (prev === 0 ? 1 : prev === 1 ? 2 : 0));

    const handleWheel = (e: React.WheelEvent) => {
        setVolume((prev) => {
            const newVol = prev - (e.deltaY > 0 ? 0.05 : -0.05);
            return Math.max(0, Math.min(1, newVol));
        });
    };

    const handleQueryChange = (value: string) => {
        setQuery(value);
        setShowSuggestions(true);
        if (value === '') {
            setResults([]);
            setSuggestions([]);
        }
    };

    // ── Derived ────────────────────────────────────────────────────

    const currentCoverRaw =
        albumView && !currentSong?.thumbnails
            ? albumView.cover
            : currentSong?.thumbnails?.[currentSong.thumbnails.length - 1]?.url || 'https://via.placeholder.com/500';
    const currentCover = getHighResCover(currentCoverRaw);
    const progressPercent = duration > 0 ? (played / duration) * 100 : 0;

    // ── Render ─────────────────────────────────────────────────────

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background text-text transition-colors duration-200">
            {/* Sidebar */}
            <AnimatePresence>
                {(isSidebarOpen || typeof window !== 'undefined' && window.innerWidth > 768) && (
                    <Sidebar
                        onGoHome={() => {
                            setViewState('home');
                            setQuery('');
                            setResults([]);
                            setAlbumView(null);
                            setIsSidebarOpen(false);
                        }}
                        onClose={() => setIsSidebarOpen(false)}
                        onShowLiked={() => {
                            setViewState('liked');
                            setQuery('');
                            setResults([]);
                            setAlbumView(null);
                            setIsSidebarOpen(false);
                        }}
                        likedCount={liked.length}
                    />
                )}
            </AnimatePresence>

            {/* Mobile overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/40 z-30 md:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Main area */}
            <div className="flex-1 flex flex-col relative overflow-hidden">
                <Header
                    query={query}
                    suggestions={suggestions}
                    showSuggestions={showSuggestions}
                    onQueryChange={handleQueryChange}
                    onSearch={searchMusicHandler}
                    onSuggestionClick={executeSearch}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    onMenuClick={() => setIsSidebarOpen(true)}
                />

                <main className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-6 lg:px-8 pt-5 pb-28">
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <LoadingSpinner key="loading" />
                        ) : albumView ? (
                            <AlbumView
                                key="album"
                                albumView={albumView}
                                currentSongId={currentSong?.videoId}
                                onBack={() => setAlbumView(null)}
                                onPlayItem={handleItemClick}
                                isLiked={isLiked}
                                onToggleLike={toggleLike}
                            />
                        ) : viewState === 'liked' ? (
                            <HomeContent
                                key="liked"
                                homeData={[{ title: 'Liked Songs', contents: liked }]}
                                homeLoading={false}
                                results={[]}
                                query=""
                                currentSongId={currentSong?.videoId}
                                onPlayItem={handleItemClick}
                                isLiked={isLiked}
                                onToggleLike={toggleLike}
                            />
                        ) : (
                            <HomeContent
                                key="home"
                                homeData={[...(recent.length > 0 ? [{ title: 'Recently Played', contents: recent }] : []), ...homeData]}
                                homeLoading={homeLoading}
                                results={results}
                                query={query}
                                currentSongId={currentSong?.videoId}
                                onPlayItem={handleItemClick}
                                isLiked={isLiked}
                                onToggleLike={toggleLike}
                            />
                        )}
                    </AnimatePresence>
                </main>
            </div>

            {/* Mini Player */}
            <AnimatePresence>
                {currentSong && !isFullPlayerOpen && (
                    <MiniPlayer
                        currentSong={currentSong}
                        currentCover={currentCover}
                        isPlaying={isPlaying}
                        played={played}
                        duration={duration}
                        progressPercent={progressPercent}
                        hoverTime={hoverTime}
                        hoverLeft={hoverLeft}
                        onPlayPause={() => setIsPlaying(!isPlaying)}
                        onNext={playNext}
                        onPrev={playPrev}
                        onSeek={handleSeek}
                        onTimelineMouseMove={handleTimelineMouseMove}
                        onTimelineMouseLeave={handleTimelineMouseLeave}
                        onExpand={() => setIsFullPlayerOpen(true)}
                        onWheel={handleWheel}
                        isLiked={currentSong ? isLiked(currentSong.videoId) : false}
                        onToggleLike={() => currentSong && toggleLike(currentSong)}
                    />
                )}
            </AnimatePresence>

            {/* Full Player */}
            <AnimatePresence>
                {isFullPlayerOpen && currentSong && (
                    <FullPlayer
                        currentSong={currentSong}
                        currentCover={currentCover}
                        isPlaying={isPlaying}
                        played={played}
                        duration={duration}
                        volume={volume}
                        repeatMode={repeatMode}
                        activeTab={activeTab}
                        lyrics={lyrics}
                        syncedLyrics={syncedLyrics}
                        isSynced={isSynced}
                        lyricsLoading={lyricsLoading}
                        lyricsContainerRef={lyricsContainerRef}
                        playerRef={playerRef}
                        onPlayPause={() => setIsPlaying(!isPlaying)}
                        onNext={playNext}
                        onPrev={playPrev}
                        onSeek={handleTimeSeek}
                        onSetPlayed={setPlayed}
                        onToggleRepeat={toggleRepeat}
                        onSetVolume={setVolume}
                        onSetActiveTab={setActiveTab}
                        onClose={() => setIsFullPlayerOpen(false)}
                        isLiked={currentSong ? isLiked(currentSong.videoId) : false}
                        onToggleLike={() => currentSong && toggleLike(currentSong)}
                    />
                )}
            </AnimatePresence>

            {/* Hidden YouTube Player */}
            <div className="absolute left-[-9999px] top-[-9999px] invisible">
                {currentSong && (
                    <YouTube
                        videoId={currentSong.videoId}
                        opts={{
                            height: '10',
                            width: '10',
                            playerVars: {
                                autoplay: 1,
                                controls: 0,
                                disablekb: 1,
                                fs: 0,
                                playsinline: 1,
                            },
                        }}
                        onReady={(event) => {
                            playerRef.current = event.target;
                            playerRef.current.setVolume(volume * 100);
                            if (isPlaying) playerRef.current.playVideo();
                        }}
                        onStateChange={(event) => {
                            if (event.data === 1) setIsPlaying(true);
                            else if (event.data === 2) setIsPlaying(false);
                            else if (event.data === 0) handleSongEnd();
                        }}
                        onError={(e) => {
                            console.error('YouTube Player Error', e);
                            playNext();
                        }}
                    />
                )}
            </div>
        </div>
    );
}

export default App;