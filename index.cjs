const WordStream = require("./WordStream.cjs");
const NewsStream = require("./NewsStream.cjs");
const YPStream = require("./ypCommentsStream.cjs");
const onExit = require('./onExit.cjs');

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

module.exports = {WordStream, NewsStream, YPStream, init};
