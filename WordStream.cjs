const wiki = require('wikijs').default;
const wikiParser = require('./wiki-parse-fkt.cjs');
const cheerio = require('cheerio');
const CircularLinks = require('./CircularLinks.cjs');

class WordStream {
    constructor(word = 'maus', lang = 'en') {
        this.startWord = word;
        this.circularLinks = new CircularLinks(word);

        this.lang = lang;
        this.apiData = {
            apiUrl: `https://${lang}.wikipedia.org/w/api.php`,
            origin: null
        }
    }

    async searchArticle(str = 'Maus') {
        console.log('searchArticle: ', str)
        console.log(' ')

        return wiki(this.apiData)
            .search(str)
            .then(async p => {

                const results = p.results;

                if (!results.length) {
                    if (str.length == 1) {
                        return Promise.reject('string to small: "' + str + '"');
                    }
                    const str2 = str.substring(0, str.length - 1);
                    //  console.log('new str: ', str2);

                    return await this.searchArticle(str2);
                }

                this.circularLinks.addLinks(results);
                const title = await this.circularLinks.getNext().title;
                console.log('----->   ', title)

                return title;
                //  p.next && p.next().then(console.log)
            }, (err) => {
                return 'err', err
            });
    }

    async check(wikijsResult) {
        /*
        * [
          'title',
          'extract',
          'image',
          'content',
          'linkOccurenceArray',
          'links'
        ]
        * */



        if (wikiParser.hasMultipleMeaning(wikijsResult)) {
            console.log('MULTO')
            process.exit()
            this.circularLinks.addLinks(Object.keys(wikijsResult.links));
            return this.getArticle(this.circularLinks.getNext().title);
        }

        const concatenatedContent = wikiParser.getContentString(wikijsResult);

        let linkInArticle = wikijsResult.linkOccurenceArray;
        linkInArticle = wikiParser.removeNotInTextExistings(concatenatedContent, linkInArticle);

        let startPos = 0,
            endPos = concatenatedContent.length;

        linkInArticle.forEach((link, index) => {
            const linkPrev = linkInArticle[index - 1];
            const linkNext = linkInArticle[index + 1];

            let linkPrevStartPos = 0,
                linkNextStartPos = concatenatedContent.length;

            if (linkPrev) {
                // console.log(linkNext.text, linkNext.cnt)
                linkPrevStartPos = wikiParser.getPositionByIndex(concatenatedContent, linkPrev.text, linkPrev.cnt);//concatenatedContent.indexOf(linkNext.text)
                linkPrevStartPos += linkPrev.text.length;

                let prevDeltaString = concatenatedContent.substring(linkPrevStartPos, link.startPos);
                prevDeltaString = wikiParser.shortPhrase(prevDeltaString, -1);
                //link.info.prev = prevDeltaString;
                prevDeltaString && wikijsResult.links[link.title].sentences.prev.push(prevDeltaString)
            }

            if (linkNext) {
                linkNextStartPos = wikiParser.getPositionByIndex(concatenatedContent, linkNext.text, linkNext.cnt);//concatenatedContent.indexOf(linkNext.text)
            }

            let nextDeltaString = concatenatedContent.substring(link.startPos + link.text.length, linkNextStartPos);
            nextDeltaString = wikiParser.shortPhrase(nextDeltaString, 1);
            //  link.info.next = nextDeltaString;
            nextDeltaString && wikijsResult.links[link.title].sentences.next.push(nextDeltaString)


            /*console.log('prev: ', linkPrevStartPos, link.info.next)
            console.log('act: ', link.text, link.startPos, link.text.length)
            console.log('next: ', linkNextStartPos);*/


            /* console.log('link.info: ', link.info.prev, '_ ' + link.text + ' _', link.info.next);

             console.log(' ', wikijsResult.links[link.title])
             console.log(' ')*/
        });

        this.circularLinks.addLinks(wikijsResult.links)
//        console.log(' -->this.circularLinks.links ',     this.circularLinks.links)
    }

    async start() {

        await this.getArticle(this.startWord);

    }

    async getArticle(title) {
        //   title = encodeURI(title);
        console.log('getArticle title: ', title)

        return wiki(this.apiData)
            .page(title)
            .then(async page => {

                const obj = await page
                    .chain()
                    .content()
                    .summary()
                    .image()
                    //.links()
                    .request();

                obj.content = await page.content();
                obj.linkOccurenceArray = [];//QUICKFIX to have a parallel order

                const html = await page.html()
                const $ = cheerio.load(html);

                const wellSortedLinks = {}

                $('a[href*="wiki/"]').each(function (index) {
                    const href = $(this).attr('href');
                    const title = $(this).attr('title');
                    const text = $(this).text();
                    const urlArr = href.split('/');
                    // console.log(index, urlArr)

                    if (urlArr.length == 3) {
                        if (urlArr[2].indexOf(':') == -1) {
                            const urlLink = urlArr[2];

                            wellSortedLinks[title] ?
                                wellSortedLinks[title].cnt++ :
                                wellSortedLinks[title] = {
                                    cnt: 1,
                                    urlLink,
                                    title,
                                    text,
                                    sentences: {prev: [], next: []}
                                };

                            obj.linkOccurenceArray.push(JSON.parse(JSON.stringify(wellSortedLinks[title])));

                            //  console.log(index,  wellSortedLinks[title])

                        } else {
                            //  console.log('weg: -', index, $(this).attr('href'))--> images_bak
                        }
                    }
                });

                obj.links = wellSortedLinks;

                await this.check(obj);

                return obj;
            }, async (err) => {

                const foundWord = await this.searchArticle(title);

                console.log('foundWord ', foundWord, title)

                return await this.getArticle(foundWord);
            });
    }



    getNext() {


        if (Object.keys(this.circularLinks.links).length <= 20) {//>= erste ist ursprungslink


            //not async
            const it = async () => {



                const nextLinkTitle = Object.keys(this.circularLinks.usedLinks)[1];//   const firstElKey = Object.keys(this.links)[0]//this.circularLinks.getNext().title

                console.log('#########----...... ', nextLinkTitle)
                const nextLink = this.circularLinks.usedLinks[nextLinkTitle];

                if (nextLink) {
                    delete this.circularLinks.usedLinks[nextLinkTitle];
                    console.log('###### nextLinkTitle', nextLinkTitle);
                    await this.getArticle(nextLinkTitle);


                    /*
                    console.log('###### not tested; :load nextLink from used Link ----->', nextLink);
                    nextLink.usedCnt = nextLink.usedCnt ? nextLink.usedCnt++ : 1;
                    const nl = JSON.parse(JSON.stringify(nextLink));

                    delete this.circularLinks.usedLinks[nextLinkTitle];


                    if (nextLink.usedCnt > 4) {
                        console.log('###### not tested; :load nextLink from used Link ----->', nl);
                        await this.getArticle(nextLinkTitle);
                    } else {
                        this.circularLinks.usedLinks[nextLinkTitle] = nl;
                        await it();
                    }*/
                }
            }
            it();
        }


        return this.circularLinks.getNext();
    }
}


module.exports = WordStream;