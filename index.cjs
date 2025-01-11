import WordStream from "./WordStream.js";
import NewsStream from "./NewsStream.js";
import YPStream from "./ypCommentsStream.js";
import onExit from './onExit.js';

async function init(words = [['Maus', 'de']]) {

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


        return streams;
    });
}

export {WordStream, NewsStream, YPStream, init};
