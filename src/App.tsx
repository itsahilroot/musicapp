import { useState, useEffect, useRef } from 'react';
import { Search, Play, Pause, SkipForward, SkipBack, Music, Volume2, VolumeX, ChevronDown, Repeat, Repeat1, ArrowLeft } from 'lucide-react';
import './index.css';

import { getHome, getSuggestions } from './api';

function App() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [currentSong, setCurrentSong] = useState<any | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Volume controls
  const [volume, setVolume] = useState(0.5);
  const [isVolumeOpen, setIsVolumeOpen] = useState(false);

  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [repeatMode, setRepeatMode] = useState<0 | 1 | 2>(0); // 0: none, 1: all, 2: one

  // Full Player States
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'poster' | 'lyrics'>('poster');
  const [lyrics, setLyrics] = useState<string>('');
  const [syncedLyrics, setSyncedLyrics] = useState<{ time: number, text: string }[]>([]);
  const [isSynced, setIsSynced] = useState(false);
  const [lyricsLoading, setLyricsLoading] = useState(false);

  // Timeline hover state
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverLeft, setHoverLeft] = useState<number>(0);

  // Home & Related & Album Data
  const [homeData, setHomeData] = useState<any[]>([]);
  const [relatedSongs, setRelatedSongs] = useState<any[]>([]);
  const [albumView, setAlbumView] = useState<{ title: string, tracks: any[], cover?: string } | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch home data on mount
    getHome()
      .then(data => {
        if (data.home) setHomeData(data.home);
      })
      .catch(err => console.error("Failed to fetch home data", err));
  }, []);

  // Suggestions debounced
  useEffect(() => {
    if (query.trim().length > 1) {
      const delay = setTimeout(() => {
        getSuggestions(query)
          .then(data => setSuggestions(data.suggestions || []));
      }, 300);
      return () => clearTimeout(delay);
    } else {
      setSuggestions([]);
    }
  }, [query]);

  useEffect(() => {
    if (currentSong) {
      setStreamUrl(null);
      setPlayed(0);
      setDuration(0);
      setIsPlaying(false);
      setLyrics('');
      setSyncedLyrics([]);
      setIsSynced(false);
      setLyricsLoading(true);

      // Fetch audio stream
      import('./api').then(api => {
        api.streamMusic(currentSong.videoId)
          .then(data => {
            setStreamUrl(data.url);
            setIsPlaying(true);
          })
          .catch(err => console.error("Failed to fetch stream URL", err));

        // Fetch lyrics
        const artist = currentSong.artists?.[0]?.name || "";
        const title = currentSong.title || "";
        api.getLyrics(currentSong.videoId, title, artist)
          .then(data => {
            if (data.synced && data.lyrics) {
              setIsSynced(true);
              const lines = data.lyrics.split('\n').map((line: string) => {
                const match = line.match(/\[(\d+):(\d+(?:\.\d+)?)\](.*)/);
                if (match) {
                  return {
                    time: parseInt(match[1]) * 60 + parseFloat(match[2]),
                    text: match[3].trim()
                  };
                }
                return null;
              }).filter(Boolean);
              setSyncedLyrics(lines as any);
            } else {
              setLyrics(data.lyrics || "Lyrics not available.");
            }
          })
          .catch(() => setLyrics("Lyrics not available."))
          .finally(() => setLyricsLoading(false));

        // Fetch related if not in album view
        if (!albumView) {
          api.getRelated(currentSong.videoId)
            .then(data => {
              if (data.related) setRelatedSongs(data.related);
            })
            .catch(err => console.error("Failed to fetch related", err));
        }
      });
    }
  }, [currentSong]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Playback failed:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, volume, streamUrl]);

  // Scroll synced lyrics
  useEffect(() => {
    if (isSynced && activeTab === 'lyrics' && lyricsContainerRef.current) {
      const activeLine = document.querySelector('.lyrics-line.active');
      if (activeLine) {
        activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [played, isSynced, activeTab]);

  const handleSongEnd = () => {
    if (repeatMode === 2) {
      // Repeat one
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else {
      playNext();
    }
  };

  const playNext = () => {
    const listToUse = albumView ? albumView.tracks : (relatedSongs.length > 0 ? relatedSongs : results);
    if (!currentSong || listToUse.length === 0) return;
    const currentIndex = listToUse.findIndex((s) => s.videoId === currentSong.videoId);
    if (currentIndex !== -1 && currentIndex < listToUse.length - 1) {
      setCurrentSong(listToUse[currentIndex + 1]);
    } else if (repeatMode === 1 && listToUse.length > 0) {
      // Repeat all
      setCurrentSong(listToUse[0]);
    }
  };

  const playPrev = () => {
    const listToUse = albumView ? albumView.tracks : (relatedSongs.length > 0 ? relatedSongs : results);
    if (!currentSong || listToUse.length === 0) return;
    const currentIndex = listToUse.findIndex((s) => s.videoId === currentSong.videoId);
    if (currentIndex > 0) {
      setCurrentSong(listToUse[currentIndex - 1]);
    }
  };

  const executeSearch = async (searchQuery: string) => {
    if (!searchQuery) return;
    setQuery(searchQuery);
    setShowSuggestions(false);
    setLoading(true);
    setAlbumView(null);
    try {
      import('./api').then(api => {
        api.searchMusic(searchQuery).then(data => {
          setResults(data.results || []);
        }).catch(err => console.error("Search API error:", err));
      });
    } catch (error) {
      console.error("Failed to search", error);
    } finally {
      setLoading(false);
    }
  };

  const searchMusic = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query);
  };

  const handleItemClick = (item: any) => {
    // If it's a song, play it
    if (item.videoId) {
      setCurrentSong(item);
      setIsFullPlayerOpen(true);
    }
    // If it's a playlist or album
    else if (item.playlistId || item.browseId) {
      const id = item.playlistId || item.browseId;
      setLoading(true);
      import('./api').then(api => {
        api.getPlaylist(id)
          .then(data => {
            if (data.tracks) {
              setAlbumView({
                title: data.title || item.title,
                tracks: data.tracks,
                cover: item.thumbnails?.[item.thumbnails.length - 1]?.url
              });
            } else {
              console.error("Failed to load playlist or album");
            }
            setResults([]); // hide search results
          })
          .catch(err => console.error(err))
          .finally(() => setLoading(false));
      });
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    if (hh) {
      return `${hh}:${mm.toString().padStart(2, '0')}:${ss}`;
    }
    return `${mm}:${ss}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setPlayed(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLInputElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    setHoverTime(percentage * duration);
    setHoverLeft(x);
  };

  const handleTimelineMouseLeave = () => {
    setHoverTime(null);
  };

  const toggleRepeat = () => {
    setRepeatMode(prev => (prev === 0 ? 1 : prev === 1 ? 2 : 0));
  };

  const getHighResCover = (url?: string) => {
    if (!url) return 'https://via.placeholder.com/500';
    if (url.includes('=')) {
      url = url.replace(/=w\d+-h\d+/, '=w1080-h1080').replace(/=s\d+/, '=w1080-h1080');
    }
    if (url.includes('sqdefault.jpg') || url.includes('hqdefault.jpg') || url.includes('sddefault.jpg')) {
      url = url.replace(/(sq|hq|sd)default\.jpg/, 'maxresdefault.jpg');
    }
    return url.replace(/w\d+-h\d+/, 'w1080-h1080');
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, title: string, videoId?: string) => {
    const img = e.currentTarget;
    const fallbackState = img.getAttribute('data-fallback') || '0';

    if (fallbackState === '0') {
      img.setAttribute('data-fallback', '1');
      if (videoId) {
        img.src = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        return;
      }
    }

    if (fallbackState === '1' || (fallbackState === '0' && !videoId)) {
      img.setAttribute('data-fallback', '2');
      fetch(`https://www.jiosaavn.com/api.php?__call=autocomplete.get&query=${encodeURIComponent(title)}&_format=json&_marker=0&ctx=web6dot0`)
        .then(res => res.json())
        .then(data => {
          if ('songs' in data && 'data' in data['songs'] && data['songs']['data'].length > 0) {
            let coverImg = data['songs']['data'][0]['image'];
            coverImg = coverImg.replace('50x50', '500x500');
            img.src = coverImg;
          } else {
            img.setAttribute('data-fallback', '3');
            img.src = 'https://via.placeholder.com/500?text=No+Cover';
          }
        })
        .catch(() => {
          img.setAttribute('data-fallback', '3');
          img.src = 'https://via.placeholder.com/500?text=No+Cover';
        });
    } else if (fallbackState === '2') {
      img.setAttribute('data-fallback', '3');
      img.src = 'https://via.placeholder.com/500?text=No+Cover';
    }
  };

  const currentCoverRaw = albumView && !currentSong?.thumbnails ? albumView.cover : (currentSong?.thumbnails?.[currentSong.thumbnails.length - 1]?.url || 'https://via.placeholder.com/500');
  const currentCover = getHighResCover(currentCoverRaw);

  const progressPercent = duration > 0 ? (played / duration) * 100 : 0;

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo" onClick={() => { setQuery(''); setResults([]); setAlbumView(null); }}>
          <Music size={24} color="#fa243c" fill="#fa243c" />
          <span style={{ cursor: 'pointer' }}>Music</span>
        </div>
        <div className="search-container">
          <form className="search-bar" onSubmit={searchMusic}>
            <Search size={18} color="#ebebf599" />
            <input
              type="text"
              placeholder="Search songs, artists, albums..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
                if (e.target.value === '') {
                  setResults([]);
                  setSuggestions([]);
                }
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
          </form>
          {showSuggestions && suggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {suggestions.map((sug, i) => (
                <div key={i} className="suggestion-item" onClick={() => executeSearch(sug)}>
                  <Search size={14} /> {sug}
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="main-content">
        {loading ? (
          <div className="spinner"></div>
        ) : albumView ? (
          <div className="album-view">
            <button className="back-btn" onClick={() => setAlbumView(null)}>
              <ArrowLeft size={20} /> Back
            </button>
            <div className="album-header">
              <img src={getHighResCover(albumView.cover || '')} alt={albumView.title} className="album-cover" onError={(e) => handleImageError(e, albumView.title)} />
              <div className="album-info">
                <h1>{albumView.title}</h1>
                <p>{albumView.tracks.length} tracks</p>
                <button className="play-all-btn" onClick={() => {
                  if (albumView.tracks.length > 0) handleItemClick(albumView.tracks[0]);
                }}>
                  <Play size={20} fill="black" color="black" /> Play All
                </button>
              </div>
            </div>
            <div className="album-tracks">
              {albumView.tracks.map((track, i) => (
                <div className="track-item" key={i} onClick={() => handleItemClick(track)}>
                  <span className="track-num">{i + 1}</span>
                  <div className="track-details">
                    <div className="track-title">{track.title}</div>
                    <div className="track-artist">{track.artists?.map((a: any) => a.name).join(', ')}</div>
                  </div>
                  {currentSong?.videoId === track.videoId && <Music size={16} color="var(--am-accent)" />}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {query && results.length > 0 && (
              <>
                <h2 className="section-title">Search Results</h2>
                <div className="song-grid">
                  {results.map((song, i) => (
                    <div className="song-card" key={i} onClick={() => handleItemClick(song)}>
                      <div className="song-cover-container">
                        <img
                          src={getHighResCover(song.thumbnails?.[song.thumbnails.length - 1]?.url)}
                          alt={song.title}
                          className="song-cover"
                          onError={(e) => handleImageError(e, song.title, song.videoId)}
                        />
                        <div className="play-overlay">
                          <Play size={20} fill="white" />
                        </div>
                      </div>
                      <div className="song-info">
                        <div className="song-title">{song.title}</div>
                        <div className="song-artist">
                          {song.artists?.map((a: any) => a.name).join(', ') || (song.playlistId ? 'Playlist' : 'Album')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {!query && homeData.map((shelf, idx) => (
              shelf.contents && shelf.contents.length > 0 && (
                <div key={idx} className="home-shelf">
                  <h2 className="section-title">{shelf.title}</h2>
                  <div className="song-grid">
                    {shelf.contents.map((item: any, i: number) => (
                      <div className="song-card" key={i} onClick={() => handleItemClick(item)}>
                        <div className="song-cover-container">
                          <img
                            src={getHighResCover(item.thumbnails?.[item.thumbnails.length - 1]?.url)}
                            alt={item.title}
                            className="song-cover"
                            onError={(e) => handleImageError(e, item.title, item.videoId)}
                          />
                          <div className="play-overlay">
                            <Play size={20} fill="white" />
                          </div>
                        </div>
                        <div className="song-info">
                          <div className="song-title">{item.title}</div>
                          <div className="song-artist">
                            {item.artists?.map((a: any) => a.name).join(', ') || (item.playlistId ? 'Playlist' : 'Album')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </>
        )}
      </main>

      {/* Mini Player */}
      {currentSong && (
        <div className="player-container" onClick={() => setIsFullPlayerOpen(true)}>
          <div
            className="mini-timeline-wrapper"
            onClick={e => e.stopPropagation()}
            onMouseMove={handleTimelineMouseMove}
            onMouseLeave={handleTimelineMouseLeave}
          >
            <input
              type="range"
              min={0}
              max={duration || 1}
              step={0.1}
              value={played}
              onChange={handleSeek}
              className="mini-styled-slider"
              style={{ '--val': `${progressPercent}%` } as any}
            />
            {hoverTime !== null && (
              <div className="timeline-tooltip" style={{ left: hoverLeft }}>
                {formatTime(hoverTime)}
              </div>
            )}
          </div>

          <div className="player-info">
            <img
              src={currentCover}
              alt={currentSong.title}
              className="player-cover"
              onError={(e) => handleImageError(e, currentSong.title, currentSong.videoId)}
            />
            <div className="song-info">
              <div className="song-title">{currentSong.title}</div>
              <div className="song-artist">
                {currentSong.artists?.map((a: any) => a.name).join(', ')}
              </div>
            </div>
          </div>

          <div className="player-center" onClick={e => e.stopPropagation()}>
            <div className="player-controls">
              <button className="control-btn media-btn" onClick={playPrev}><SkipBack size={18} fill="currentColor" /></button>
              <button className="control-btn media-btn play-btn" onClick={() => setIsPlaying(!isPlaying)} disabled={!streamUrl}>
                {isPlaying ? <Pause size={18} fill="white" color="white" /> : <Play size={18} fill="white" color="white" style={{ marginLeft: '2px' }} />}
              </button>
              <button className="control-btn media-btn" onClick={playNext}><SkipForward size={18} fill="currentColor" /></button>
            </div>
          </div>

          <div className="volume-control-wrapper" onClick={e => e.stopPropagation()}>
            <div
              className="volume-control"
              onMouseEnter={() => setIsVolumeOpen(true)}
              onMouseLeave={() => setIsVolumeOpen(false)}
            >
              <button className="control-btn" onClick={() => setVolume(volume === 0 ? 0.5 : 0)}>
                {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>

              {isVolumeOpen && (
                <div className="volume-popover">
                  <span className="vol-percent">{Math.round(volume * 100)}%</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="styled-slider"
                    style={{ '--val': `${volume * 100}%` } as any}
                  />
                </div>
              )}
            </div>
          </div>

          {streamUrl && (
            <audio
              ref={audioRef}
              src={streamUrl}
              onEnded={handleSongEnd}
              onTimeUpdate={() => {
                if (audioRef.current) {
                  setPlayed(audioRef.current.currentTime);
                }
              }}
              onLoadedMetadata={() => {
                if (audioRef.current) {
                  setDuration(audioRef.current.duration);
                }
              }}
              onError={(e) => console.error("Audio error", e)}
            />
          )}
        </div>
      )}

      {/* Full Player Overlay */}
      {currentSong && (
        <div className={`full-player-overlay ${isFullPlayerOpen ? 'open' : ''}`}>
          <div className="fp-bg" style={{ backgroundImage: `url(${currentCover})` }}></div>

          <div className="fp-scroll-container">
            <div className="fp-header">
              <button className="close-fp-btn" onClick={() => setIsFullPlayerOpen(false)}>
                <ChevronDown size={24} />
              </button>
              <div className="fp-tabs">
                <button
                  className={`fp-tab ${activeTab === 'poster' ? 'active' : ''}`}
                  onClick={() => setActiveTab('poster')}
                >
                  Poster
                </button>
                <button
                  className={`fp-tab ${activeTab === 'lyrics' ? 'active' : ''}`}
                  onClick={() => setActiveTab('lyrics')}
                >
                  Lyrics
                </button>
              </div>
              <div style={{ width: 40 }}></div>
            </div>

            <div className="fp-content">
              {activeTab === 'poster' ? (
                <div className="fp-cover-container">
                  <img src={currentCover} alt={currentSong.title} className="fp-cover" onError={(e) => handleImageError(e, currentSong.title, currentSong.videoId)} />
                </div>
              ) : (
                <div className="fp-lyrics-container" ref={lyricsContainerRef}>
                  {lyricsLoading ? (
                    <div className="spinner"></div>
                  ) : isSynced ? (
                    syncedLyrics.map((line, i) => {
                      const isActive = played >= line.time && (i === syncedLyrics.length - 1 || played < syncedLyrics[i + 1].time);
                      return (
                        <p key={i} className={`lyrics-line ${isActive ? 'active' : ''}`} onClick={() => {
                          if (audioRef.current) { audioRef.current.currentTime = line.time; setPlayed(line.time); }
                        }}>
                          {line.text || '\u00A0'}
                        </p>
                      );
                    })
                  ) : (
                    lyrics.split('\n').map((line, i) => (
                      <p key={i} className="lyrics-line">{line || '\u00A0'}</p>
                    ))
                  )}
                </div>
              )}

              <div className="fp-controls-container">
                <div className="fp-info-row">
                  <div className="fp-info">
                    <div className="fp-title">{currentSong.title}</div>
                    <div className="fp-artist">
                      {currentSong.artists?.map((a: any) => a.name).join(', ')}
                    </div>
                  </div>
                </div>

                <div className="timeline-container">
                  <span>{formatTime(played)}</span>
                  <div className="slider-wrapper" style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                    <input
                      type="range"
                      min={0}
                      max={duration || 1}
                      step={0.1}
                      value={played}
                      onChange={handleSeek}
                      onMouseMove={handleTimelineMouseMove}
                      onMouseLeave={handleTimelineMouseLeave}
                      className="styled-slider"
                      style={{ '--val': `${progressPercent}%` } as any}
                    />
                    {hoverTime !== null && (
                      <div className="timeline-tooltip" style={{ left: hoverLeft }}>
                        {formatTime(hoverTime)}
                      </div>
                    )}
                  </div>
                  <span>{formatTime(duration)}</span>
                </div>

                <div className="fp-main-controls-wrapper">
                  <button className="control-btn secondary-btn" onClick={toggleRepeat}>
                    {repeatMode === 2 ? <Repeat1 size={24} color="var(--am-accent)" /> :
                      repeatMode === 1 ? <Repeat size={24} color="var(--am-accent)" /> :
                        <Repeat size={24} color="rgba(255,255,255,0.5)" />}
                  </button>

                  <div className="fp-main-controls">
                    <button className="control-btn media-btn" onClick={playPrev}><SkipBack size={28} fill="currentColor" /></button>
                    <button className="control-btn media-btn play-btn" onClick={() => setIsPlaying(!isPlaying)} disabled={!streamUrl}>
                      {isPlaying ? <Pause size={36} fill="white" color="white" /> : <Play size={36} fill="white" color="white" style={{ marginLeft: '4px' }} />}
                    </button>
                    <button className="control-btn media-btn" onClick={playNext}><SkipForward size={28} fill="currentColor" /></button>
                  </div>

                  <div
                    className="volume-control"
                    style={{ position: 'relative' }}
                    onMouseEnter={() => setIsVolumeOpen(true)}
                    onMouseLeave={() => setIsVolumeOpen(false)}
                  >
                    <button className="control-btn secondary-btn" onClick={() => setVolume(volume === 0 ? 0.5 : 0)}>
                      {volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
                    </button>

                    {isVolumeOpen && (
                      <div className="volume-popover fp-vol-popover">
                        <span className="vol-percent">{Math.round(volume * 100)}%</span>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.01}
                          value={volume}
                          onChange={(e) => setVolume(parseFloat(e.target.value))}
                          className="styled-slider"
                          style={{ '--val': `${volume * 100}%` } as any}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Related Songs / Album Tracks Section in Full Player */}
            {(albumView ? albumView.tracks : relatedSongs).length > 0 && (
              <div className="related-songs-section">
                <h3 className="section-title" style={{ fontSize: '1.25rem', padding: '0 2rem' }}>
                  {albumView ? 'Album Tracks' : 'Related Songs'}
                </h3>
                <div className="related-songs-list">
                  {(albumView ? albumView.tracks : relatedSongs).map((song, i) => (
                    <div className="related-song-card" key={i} onClick={() => handleItemClick(song)}>
                      <img
                        src={getHighResCover(song.thumbnails?.[song.thumbnails.length - 1]?.url)}
                        alt={song.title}
                        className="related-cover"
                        onError={(e) => handleImageError(e, song.title, song.videoId)}
                      />
                      <div className="related-info">
                        <div className="related-title" style={{ color: currentSong?.videoId === song.videoId ? 'var(--am-accent)' : 'white' }}>
                          {song.title}
                        </div>
                        <div className="related-artist">
                          {song.artists?.map((a: any) => a.name).join(', ')}
                        </div>
                      </div>
                      <button className="control-btn"><Play size={20} fill={currentSong?.videoId === song.videoId ? 'var(--am-accent)' : 'white'} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
