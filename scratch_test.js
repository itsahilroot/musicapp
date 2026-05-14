import * as nym from 'node-youtube-music';

async function test() {
  console.log(Object.keys(nym));
  try {
    const musics = await nym.searchMusics('Never gonna give you up');
    console.log("musics[0]:", musics[0]);
  } catch (e) {
    console.log("error", e);
  }
}

test();
