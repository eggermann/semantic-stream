import pkg from './index.js';

const { WordStream, NewsStream, YPStream, init } = pkg;

async function testWordStream() {

    const wordStream = new WordStream('Robotics', 'en',{circularLinkTypeXX:'getNextUnique'});
    await wordStream.start();


    for (let i = 0; i < 10000; i++) {
        const item = await wordStream.getNext();
        console.log(`WordStream test (${i + 1}):`, item.urlLink);
        if (!item || !item.title) {
            throw new Error(`WordStream test failed on iteration ${i + 1}: No item or title found`);
        }
    }
}

async function testNewsStream() {
    const newsStream = new NewsStream({ /* options */ });
    await newsStream.start();
    const link = await newsStream.getNext();
    console.log('NewsStream test:', link);
    if (!link || !link.title) {
        throw new Error('NewsStream test failed: No link or title found');
    }
}

async function testYPStream() {
    const ypStream = new YPStream({ /* options */ });
    await ypStream.start();
    const link = await ypStream.getNext();
    console.log('YPStream test:', link);
    if (!link || !link.title) {
        throw new Error('YPStream test failed: No link or title found');
    }
}

async function testInitStreams() {
    const options = {
        words: [
            ['test', 'en'],
            [':YP', { /* options */ }],
            [':NEWS', { /* options */ }]
        ]
    };
    const streams = await initStreams(options);
    console.log('initStreams test:', streams);
    if (!streams || streams.length !== 3) {
        throw new Error('initStreams test failed: Incorrect number of streams');
    }
}

async function runTests() {
    try {
        await testWordStream();
       // await testNewsStream();
       // await testYPStream();
       // await testInitStreams();
        console.log('All tests passed!');
    } catch (error) {
        console.error('Test failed:', error);
    }
}

runTests();
