import WordStream from './lib/word-engine/WordStream.cjs';
import NewsStream from './lib/word-engine/NewsStream.cjs';
import YPStream from './lib/word-engine/ypCommentsStream.cjs';

async function initStreams(options = { words: [] }) {
    const { words } = options;
    const streams = [];

    for (const wordAndLang of words) {
        let stream;
        if (wordAndLang[0][0] === ':') {
            const streamOptions = wordAndLang[1];
            if (wordAndLang[0] === ':YP') {
                stream = new YPStream(streamOptions);
            } else { // news
                stream = new NewsStream(streamOptions);
            }
        } else { // default wiki
            stream = new WordStream(wordAndLang[0], wordAndLang[1]);
        }
        await stream.start();
        streams.push(stream);
    }
    return streams;
}

export { WordStream, NewsStream, YPStream, initStreams };
