// @ts-nocheck
import { Innertube, UniversalCache } from 'youtubei.js';

let yt: Innertube | null = null;
const initYt = async () => {
  if (!yt) {
    yt = await Innertube.create({
      cache: new UniversalCache(false),
      generate_session_locally: true
    });
  }
  return yt;
};

export const searchMusic = async (query: string) => {
  const yt = await initYt();
  const search = await yt.music.search(query, { type: 'song' });
  return {
    results: search.contents?.map((item: any) => ({
      videoId: item.id,
      title: item.title,
      artists: item.artists?.map((a: any) => ({ name: a.name })) || [],
      thumbnails: item.thumbnails || []
    })) || []
  };
};

export const streamMusic = async (videoId: string) => {
  const yt = await initYt();
  const info = await yt.getBasicInfo(videoId);
  const format = info.chooseFormat({ type: 'audio', quality: 'best' });
  const url = format?.decipher ? await Promise.resolve(format.decipher(yt.session.player)) : format?.url;
  return { url: url || null };
};

export const getHome = async () => {
  const yt = await initYt();
  const home = await yt.music.getHomeFeed();
  return {
    home: home.sections?.map((section: any) => ({
      title: section.title?.text || section.header?.title?.text,
      contents: section.contents?.map((item: any) => ({
        videoId: item.id,
        title: item.title,
        artists: item.artists?.map((a: any) => ({ name: a.name })) || [],
        thumbnails: item.thumbnails || []
      }))
    })) || []
  };
};

export const getRelated = async (videoId: string) => {
  const yt = await initYt();
  const upNext = await yt.music.getUpNext(videoId);
  return {
    related: upNext.contents?.map((item: any) => ({
      videoId: item.id,
      title: item.title,
      artists: item.artists?.map((a: any) => ({ name: a.name })) || [],
      thumbnails: item.thumbnails || []
    })) || []
  };
};

export const getSuggestions = async (query: string) => {
  const yt = await initYt();
  const suggestions = await yt.music.getSearchSuggestions(query);
  return { suggestions: suggestions.map(s => s.text) || [] };
};

export const getPlaylist = async (browseId: string) => {
  const yt = await initYt();
  try {
    if (browseId.startsWith('MPREb')) {
      const album = await yt.music.getAlbum(browseId);
      return {
        title: album.header?.title?.text || "Album",
        tracks: album.contents?.map((item: any) => ({
          videoId: item.id,
          title: item.title,
          artists: item.artists?.map((a: any) => ({ name: a.name })) || [],
          thumbnails: item.thumbnails || []
        })) || []
      };
    } else {
      const playlist = await yt.music.getPlaylist(browseId);
      return {
        title: playlist.header?.title?.text || "Playlist",
        tracks: playlist.items?.map((item: any) => ({
          videoId: item.id,
          title: item.title,
          artists: item.artists?.map((a: any) => ({ name: a.name })) || [],
          thumbnails: item.thumbnails || []
        })) || []
      };
    }
  } catch (e) {
    return { title: "Error", tracks: [] };
  }
};

export const getLyrics = async (videoId: string, title: string, artist: string) => {
  try {
    const res = await fetch(`https://lrclib.net/api/get?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.syncedLyrics) return { lyrics: data.syncedLyrics, synced: true };
      if (data.plainLyrics) return { lyrics: data.plainLyrics, synced: false };
    }
  } catch (e) {}
  
  try {
    const yt = await initYt();
    const lyrics = await yt.music.getLyrics(videoId);
    if (lyrics && lyrics.description) {
      return { lyrics: lyrics.description.text, synced: false };
    }
  } catch (e) { }

  return { lyrics: "Lyrics not available.", synced: false };
};
