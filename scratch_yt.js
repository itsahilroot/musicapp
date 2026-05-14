import { Innertube, UniversalCache } from 'youtubei.js';

async function test() {
  const yt = await Innertube.create({ cache: new UniversalCache(false) });
  const [songs, albums, artists] = await Promise.all([
    yt.music.search("daft punk", { type: 'song' }),
    yt.music.search("daft punk", { type: 'album' }),
    yt.music.search("daft punk", { type: 'artist' })
  ]);
  
  const extract = (res) => res.songs?.contents || res.contents?.[0]?.contents || res.albums?.contents || res.artists?.contents || [];
  
  console.log("Songs:", extract(songs).length);
  console.log("Albums:", extract(albums).length);
  console.log("Artists:", extract(artists).length);
  
  console.log(extract(albums).slice(0,1).map(c => c.id));
  console.log(extract(artists).slice(0,1).map(c => c.id));
}
test();
