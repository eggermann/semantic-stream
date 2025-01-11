
import getFromStableDiffusion from "../get-from-stable-diffusion/index.js";
import onExit from "./onExit.cjs";
import server from "../server/index.cjs";

const WordStream = require("./lib/word-engine/WordStream.cjs");
const NewsStream = require("./lib/word-engine/NewsStream.cjs");
const YPStream = require("./lib/word-engine/ypCommentsStream.cjs");
const onExit = require('./lib/helper/onExit.cjs');

async function init(words,options={}) {
    const wordStreams = words.map(async wordAndLang => {
        let wordStream = null;


        if (wordAndLang[0][0] == ':') {
            const options = wordAndLang[1];

            if (wordAndLang[0] == ':YP') {
                wordStream = new YPStream(options);
            } else {//news}
                wordStream = new NewsStream(options);
            }
        } else {
//default wiki
            wordStream = new WordStream(wordAndLang[0], wordAndLang[1]);
        }

//readin nextfunction
        if (options.circularLinksGetNext) {
            wordStream.circularLinks.getNext =
                options.circularLinksGetNext.bind(wordStream.circularLinks);
        }

        if (!wordStream.circularLinks.loadedFromCrash) {
            await wordStream.start();

        } else {
            console.log(wordStream.startWord, ' global.loadedFromCrash  ', wordStream.circularLinks.loadedFromCrash)
        }

        return wordStream;
    });


    return Promise.all(wordStreams).then(async (streams) => {

        onExit(streams);

        const getNext = function (streams, options) {

            return async () => {
                await _.loop(streams, options);
            }
        }


        server.init(getNext(streams, options))


        await _.loop(streams, options);
    });
}
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
