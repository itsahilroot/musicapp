import { useState, useCallback } from 'react';

const RECENT_KEY = 'musicfy_recent';
const LIKED_KEY = 'musicfy_liked';
const MAX_RECENT = 20;

export interface StoredSong {
    videoId: string;
    title: string;
    artists?: { name: string }[];
    thumbnails?: { url: string }[];
    playedAt?: number;
}

function readStorage<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

function writeStorage<T>(key: string, value: T) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch { }
}

export function useRecentlyPlayed() {
    const [recent, setRecent] = useState<StoredSong[]>(() => readStorage(RECENT_KEY, []));

    const addRecent = useCallback((song: any) => {
        if (!song?.videoId) return;
        setRecent((prev) => {
            const filtered = prev.filter((s) => s.videoId !== song.videoId);
            const entry: StoredSong = {
                videoId: song.videoId,
                title: song.title,
                artists: song.artists,
                thumbnails: song.thumbnails,
                playedAt: Date.now(),
            };
            const updated = [entry, ...filtered].slice(0, MAX_RECENT);
            writeStorage(RECENT_KEY, updated);
            return updated;
        });
    }, []);

    return { recent, addRecent };
}

export function useLikedSongs() {
    const [liked, setLiked] = useState<StoredSong[]>(() => readStorage(LIKED_KEY, []));

    const toggleLike = useCallback((song: any) => {
        if (!song?.videoId) return;
        setLiked((prev) => {
            const exists = prev.some((s) => s.videoId === song.videoId);
            let updated: StoredSong[];
            if (exists) {
                updated = prev.filter((s) => s.videoId !== song.videoId);
            } else {
                const entry: StoredSong = {
                    videoId: song.videoId,
                    title: song.title,
                    artists: song.artists,
                    thumbnails: song.thumbnails,
                };
                updated = [entry, ...prev];
            }
            writeStorage(LIKED_KEY, updated);
            return updated;
        });
    }, []);

    const isLiked = useCallback((videoId: string) => {
        return liked.some((s) => s.videoId === videoId);
    }, [liked]);

    return { liked, toggleLike, isLiked };
}
