// api-client.ts - Frontend API client for the backend server

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper for API calls
async function apiCall(endpoint: string, params?: Record<string, string>) {
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value) url.searchParams.append(key, value);
        });
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
    }
    return response.json();
}

export const searchMusic = (query: string) => apiCall('/search', { q: query });
export const streamMusic = (videoId: string) => apiCall('/stream', { videoId });
export const getHome = () => apiCall('/home');
export const getRelated = (videoId: string) => apiCall('/related', { videoId });
export const getSuggestions = (query: string) => apiCall('/suggestions', { q: query });
export const getPlaylist = (browseId: string) => apiCall('/playlist', { browseId });
export const getLyrics = (videoId: string, title: string, artist: string) =>
    apiCall('/lyrics', { videoId, title, artist });