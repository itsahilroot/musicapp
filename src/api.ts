// @ts-nocheck
import { Innertube, UniversalCache } from 'youtubei.js';

const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  let url = '';
  let requestMethod = 'GET';
  let requestHeaders = new Headers();
  let requestBody: any = undefined;

  if (input instanceof Request) {
    url = input.url;
    requestMethod = input.method;
    requestHeaders = new Headers(input.headers);
    requestBody = input.body;
  } else {
    url = input.toString();
  }

  const newInit: RequestInit = {
    method: init?.method || requestMethod || 'GET',
    headers: init?.headers ? new Headers(init.headers) : requestHeaders,
    body: init?.body !== undefined ? init.body : requestBody,
    ...init
  };

  const method = newInit.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD') {
    delete newInit.body;
  }

  const isNative = (window as any).Capacitor?.isNative;
  if (!isNative && (window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.'))) {
    url = url.replace('https://www.youtube.com', '/proxy/youtube')
             .replace('https://music.youtube.com', '/proxy/music')
             .replace('https://suggestqueries.google.com', '/proxy/suggest');
  }

  try {
    return await fetch(url, newInit);
  } catch (error) {
    console.error("Fetch error for url:", url, "error:", error);
    throw error;
  }
};

let yt: Innertube | null = null;
const initYt = async () => {
  if (!yt) {
    yt = await Innertube.create({
      cache: new UniversalCache(false),
      fetch: customFetch
    });
  }
  return yt;
};

export const searchMusic = async (query: string) => {
  const yt = await initYt();
  
  const [songs, albums, artists] = await Promise.all([
    yt.music.search(query, { type: 'song' }).catch(() => ({})),
    yt.music.search(query, { type: 'album' }).catch(() => ({})),
    yt.music.search(query, { type: 'artist' }).catch(() => ({}))
  ]);
  
  const extract = (res: any) => res.songs?.contents || res.contents?.[0]?.contents || res.albums?.contents || res.artists?.contents || [];
  
  const allContents = [
    ...extract(songs).slice(0, 10),
    ...extract(albums).slice(0, 5),
    ...extract(artists).slice(0, 5)
  ];

  return {
    results: allContents.map((item: any) => {
      const id = item.id || "";
      const isAlbum = id.startsWith('MPREb');
      const isPlaylist = id.startsWith('PL') || id.startsWith('VLPL') || id.startsWith('RD') || id.startsWith('VLRD') || id.startsWith('OLAK5uy_');
      const isArtist = id.startsWith('UC') && !isPlaylist;

      return {
        videoId: (!isAlbum && !isPlaylist && !isArtist) ? id : undefined,
        playlistId: isPlaylist ? id : undefined,
        browseId: (isAlbum || isArtist) ? id : undefined,
        title: typeof item.title === 'string' ? item.title : (item.title?.text || item.title?.toString() || item.name?.text || item.name?.toString() || "Unknown"),
        artists: item.artists?.map((a: any) => ({ name: typeof a.name === 'string' ? a.name : (a.name?.text || a.name?.toString() || "") })) || [],
        thumbnails: item.thumbnails || []
      };
    })
  };
};

export const streamMusic = async (videoId: string) => {
  const yt = await initYt();
  try {
    const info = await yt.getBasicInfo(videoId);
    const format = info.chooseFormat({ type: 'audio', quality: 'best' });
    
    if (format?.url) {
      return { url: format.url };
    }
    
    // @ts-ignore - signatureCipher might be available
    if ((format?.signature_cipher || format?.signatureCipher) && format?.decipher) {
      const decipheredUrl = await Promise.resolve(format.decipher(yt.session.player));
      return { url: decipheredUrl };
    }

    console.warn(`YouTube blocked stream fetching for ${videoId} (No valid URL or cipher). This is due to YouTube's recent bot protection mechanisms.`);
    return { url: null };
  } catch (e) {
    console.error("streamMusic error", e);
    return { url: null };
  }
};

export const getHome = async () => {
  const yt = await initYt();
  try {
    const home = await yt.music.getHomeFeed();
    const sections = home.sections?.map((section: any) => ({
      title: typeof section.header?.title?.text === 'string' ? section.header.title.text : (section.title?.text || section.title?.toString() || "Recommended"),
      contents: section.contents?.map((item: any) => {
        const id = item.id || "";
        const isAlbum = id.startsWith('MPREb');
        const isPlaylist = id.startsWith('PL') || id.startsWith('VLPL') || id.startsWith('RD') || id.startsWith('VLRD') || id.startsWith('OLAK5uy_');
        return {
          videoId: (!isAlbum && !isPlaylist) ? id : undefined,
          playlistId: isPlaylist ? id : undefined,
          browseId: isAlbum ? id : undefined,
          title: typeof item.title === 'string' ? item.title : (item.title?.text || item.title?.toString() || ""),
          artists: item.artists?.map((a: any) => ({ name: typeof a.name === 'string' ? a.name : (a.name?.text || a.name?.toString() || "") })) || [],
          thumbnails: item.thumbnails || []
        };
      })
    })) || [];

    if (sections.length > 0) {
      return { home: sections };
    }
  } catch (e) {
    console.error("Home feed error", e);
  }

  // Fallback: search for top playlists if home feed is empty
  try {
    const res1 = await yt.music.search("Global Top Songs", { type: 'playlist' });
    const res2 = await yt.music.search("Trending Music", { type: 'playlist' });
    const res3 = await yt.music.search("Top Hits", { type: 'playlist' });

    const mapPlaylist = (res: any) => res.playlists?.contents?.slice(0, 10).map((item: any) => ({
      playlistId: item.id,
      title: typeof item.title === 'string' ? item.title : (item.title?.text || item.title?.toString() || ""),
      artists: item.author ? [{ name: typeof item.author === 'string' ? item.author : (item.author?.name || item.author?.text || item.author?.toString() || "") }] : [],
      thumbnails: item.thumbnails || []
    })) || [];

    return {
      home: [
        { title: "Global Top Songs", contents: mapPlaylist(res1) },
        { title: "Trending Music", contents: mapPlaylist(res2) },
        { title: "Top Hits", contents: mapPlaylist(res3) }
      ].filter(s => s.contents.length > 0)
    };
  } catch (e) {
    return { home: [] };
  }
};

export const getRelated = async (videoId: string) => {
  const yt = await initYt();
  const upNext = await yt.music.getUpNext(videoId);
  return {
    related: upNext.contents?.map((item: any) => ({
      videoId: item.id,
      title: typeof item.title === 'string' ? item.title : (item.title?.text || item.title?.toString() || ""),
      artists: item.artists?.map((a: any) => ({ name: typeof a.name === 'string' ? a.name : (a.name?.text || a.name?.toString() || "") })) || [],
      thumbnails: item.thumbnails || []
    })) || []
  };
};

export const getSuggestions = async (query: string) => {
  const yt = await initYt();
  const suggestions = await yt.music.getSearchSuggestions(query);
  let result: string[] = [];
  if (suggestions.length > 0) {
    if (suggestions[0].type === 'SearchSuggestionsSection') {
      result = suggestions.flatMap((sec: any) => sec.contents || []).map((s: any) => s.suggestion?.text || s.query || s.text);
    } else {
      result = suggestions.map((s: any) => s.suggestion?.text || s.query || s.text);
    }
  }
  return { suggestions: result.filter(Boolean) };
};

export const getPlaylist = async (browseId: string) => {
  const yt = await initYt();
  try {
    if (browseId.startsWith('MPREb')) {
      const album = await yt.music.getAlbum(browseId);
      return {
        title: typeof album.header?.title === 'string' ? album.header.title : (album.header?.title?.text || album.header?.title?.toString() || "Album"),
        tracks: album.contents?.map((item: any) => ({
          videoId: item.id,
          title: typeof item.title === 'string' ? item.title : (item.title?.text || item.title?.toString() || ""),
          artists: item.artists?.map((a: any) => ({ name: typeof a.name === 'string' ? a.name : (a.name?.text || a.name?.toString() || "") })) || [],
          thumbnails: item.thumbnails || []
        })) || []
      };
    } else {
      const playlist = await yt.music.getPlaylist(browseId);
      return {
        title: typeof playlist.header?.title === 'string' ? playlist.header.title : (playlist.header?.title?.text || playlist.header?.title?.toString() || "Playlist"),
        tracks: playlist.items?.map((item: any) => ({
          videoId: item.id,
          title: typeof item.title === 'string' ? item.title : (item.title?.text || item.title?.toString() || ""),
          artists: item.artists?.map((a: any) => ({ name: typeof a.name === 'string' ? a.name : (a.name?.text || a.name?.toString() || "") })) || [],
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
    if (artist) {
      const res = await fetch(`https://lrclib.net/api/get?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.syncedLyrics) return { lyrics: data.syncedLyrics, synced: true };
        if (data.plainLyrics) return { lyrics: data.plainLyrics, synced: false };
      }
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
