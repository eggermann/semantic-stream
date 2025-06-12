import wikiParser from './wiki-parse-fkt.js';
import CircularLinks from './CircularLinks.js';
import WordStream from './WordStream.js';

import 'dotenv/config';


import NewsAPI from "newsapi";
import axios from 'axios';

class NewsStream extends WordStream {
    constructor(options) {
        super();
        this.options = options;
        this.pageCnt = 0;
        this.circularLinks = new CircularLinks(':News');
        this.isNews = true;

        const newsApiKey = process.env.NEWS_API_KEY;

        if (!newsApiKey) {
            throw new Error('Missing NEWS_API_KEY in environment variables');
        }
        this.newsapi = new NewsAPI(newsApiKey);
    }

    async start() {
        await this.getNews();
    }

    async check(articles) {
        for (const newsKey of Object.keys(articles)) {
            const news = articles[newsKey];
            news.description = news.description || '';
            news.content = news.content || '';

            // Get previous and next sentences
            const prevDeltaString = wikiParser.shortPhrase(news.description, -1);
            const nextDeltaString = wikiParser.shortPhrase(news.content, 1);

            articles[news.title].sentences.prev.push(prevDeltaString);
            articles[news.title].sentences.next.push(nextDeltaString);
        }

        this.circularLinks.addLinks(articles);
    }

    async getSources() {
        try {
            const response = await axios.get(`https://newsapi.org/v2/top-headlines/sources?apiKey=${newsApiKey}`);
            const sources = response.data.sources.map(item => item.id).join(',');
            return sources;
        } catch (error) {
            console.error(error);
            return 'bbc.co.uk,techcrunch.com';
        }
    }

    async getNews() {
        const newsSources = await this.getSources();

        try {
            const response = await this.newsapi.v2.everything({
                sources: newsSources,
                language: 'en',
                pageSize: 100,
                page: 1
            }, { noCache: true });

            const wellSortedLinks = {};

            response.articles.forEach(news => {
                const { title, description, content } = news;

                if (!wellSortedLinks[title]) {
                    wellSortedLinks[title] = {
                        cnt: 1,
                        title, description, content,
                        sentences: { prev: [], next: [] }
                    };
                } else {
                    wellSortedLinks[title].cnt++;
                }
            });

            this.wellSortedLinks = wellSortedLinks;

            await this.check(wellSortedLinks);

        } catch (error) {
            console.error('Error fetching news:', error);
            if (this.wellSortedLinks) {
                await this.check(this.wellSortedLinks);
            }
        }
    }

    async getNext() {
        const usedLinksKeys = Object.keys(this.circularLinks.usedLinks);
        if (usedLinksKeys.length > 1) {
            const nextLinkTitle = usedLinksKeys[1];
            const nextLink = this.circularLinks.usedLinks[nextLinkTitle];

            if (nextLink) {
                // Delete the first in brain to keep actuality
                delete this.circularLinks.usedLinks[nextLinkTitle];
                await this.getNews();
            }
        }
        return this.circularLinks.getNext();
    }
}

// Test Function to verify the NewsStream class
const testNewsStream = async () => {
    const options = {};
    const newsStream = new NewsStream(options);

    console.log('Starting NewsStream...');
    await newsStream.start();

    let count = 0;
    const maxCount = 5; // Limit for demonstration

    async function logNextLinkPeriodically() {
        while (count < maxCount) {
            const nextLink = await newsStream.getNext();
            console.log('Next link:', nextLink, nextLink?.title);
            await new Promise(resolve => setTimeout(resolve, 3200));
            count++;
        }
        console.log('Test finished.');
    }

    logNextLinkPeriodically();
};

export default NewsStream;

// Uncomment to run test
//testNewsStream();
