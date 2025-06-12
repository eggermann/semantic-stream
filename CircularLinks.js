import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CircularLinks = class {
    constructor(startWord, options) {
        this.links = {};
        this.usedLinks = {};
        this.startWord = startWord;
        this.options = options;
        //check for shutdowned

        this.model = {}
    }

    loadFromCrash(dir) {
        const p = path.join(dir, this.startWord + '.json')

        try {
            const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
            //   console.log(data);
            this.links = data.links;
            this.usedLinks = data.usedLinks;
            this.loadedFromCrash = true;
        } catch (e) {
        }
    }

    addUsedLink(el) {
        // console.log('ADD USED LINK ',el)

        const title = el.title;


        this.usedLinks[title] ?
            this.usedLinks[title].cnt++ :
            this.usedLinks[title] = { cnt: 1 };

        // console.log('add used link: ',         this.usedLinks[title] )
    }

    addLinks(freshLinks) {


        if (Array.isArray(freshLinks)) {
            // from suggestion or multiplmeaning
            // console.log('freshLink *** -->', freshLinks);



            freshLinks.forEach((link) => {

                // Create a Wikipedia-style URL slug using encodeURIComponent
                const urlLink = encodeURIComponent(link.replace(/ /g, '_'));

                this.links[link] ?
                    this.links[link].cnt++ :
                    (this.links[link] = {
                        urlLink,
                        cnt: 1,
                        title: link
                    });

            });


           // console.log(this.links);

        } else {

            Object.keys(freshLinks).forEach(key => {
                const newCircLink = freshLinks[key];

                this.links[key] ?
                    (() => {
                        this.links[key].cnt++;

                        if (!this.links[key].sentences) {
                            this.links[key].sentences = {
                                prev: [],
                                next: [],
                            }
                        }


                        this.links[key].sentences.prev = (this.links[key].sentences.prev
                            .concat(newCircLink.sentences.prev)).filter(i => i)
                        this.links[key].sentences.next = (this.links[key].sentences.next
                            .concat(newCircLink.sentences.next)).filter(i => i)
                    })() :
                    (() => {
                        if (this.usedLinks[key]) {
                            //--> return ;
                        }
                        // console.log('newCircLink', newCircLink)
                        this.links[key] = newCircLink;

                    })()
            });
        }
    }

    getNext() {

        if (this.options.circularLinkType === 'getNextUnique') {
            return this.getNextUnique();
        }

        if (this.options.circularLinkType === 'getNextClassic') {
            return this.getNextClassic();
        }


        let highest = 0, elementKey = '';
        for (const key in this.links) {

            const hCnt = this.links[key].cnt;

            if (hCnt > highest) {
                elementKey = key;
                highest = hCnt;
            }
        }
        // console.log('next circular link call ++>'/*, JSON.stringify(nextEl, null, 2)*/);

        if (!elementKey) {
            return false;
        }

        const nextEl = JSON.parse(JSON.stringify(this.links[elementKey]));
        //   console.log('next circular link call ++>: ', firstElKey, this.links[firstElKey],Object.keys(this.links).length)
        delete this.links[elementKey];

        if (nextEl.cnt > 1) {
            nextEl.cnt /= 10;
            //keeps the link in "game
            this.links[elementKey] = nextEl;//repeat until 0 /inhibitoric
        } else {
            this.addUsedLink(nextEl);
        }
        //this.addUsedLink(nextEl);

        // console.log(nextEl.cnt)
        //  if(nextEl.cnt)

        // console.log('- this.links[firstElKey]-------', this.links[firstElKey])
        return nextEl;
    }

    getNextClassic() {
        const firstElKey = Object.keys(this.links)[0]
        const nextEl = this.links[firstElKey];
        this.addUsedLink(nextEl);
        console.log('next circular link: ', nextEl.title)
        delete this.links[firstElKey];

        return nextEl;
    }


    getNextUnique() {
        const firstElKey = Object.keys(this.links)[0]
        const nextEl = this.links[firstElKey];
        console.log('--->', Object.keys(this.links).length, nextEl)

        delete this.links[firstElKey];
        if (this.usedLinks[nextEl.title]) {

            return null;

        }


        console.log('next circular link: ', nextEl.title)

        this.addUsedLink(nextEl);


        return nextEl;
    }
}

export default CircularLinks;
