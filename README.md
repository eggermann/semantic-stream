# semantic-stream

`semantic-stream` is a Node.js library that provides a set of stream classes for generating text from various sources, including Wikipedia articles and news feeds.

## Installation

Install the package using npm:

```bash
npm install semantic-stream
```

## Usage

Here's an example of how to use the library:

```javascript
import { WordStream, NewsStream, initStreams } from 'semantic-stream';

async function main() {
    const options = {
        words: [
            ['medicine', 'en'],
            ['disney', 'en'],
            [':NEWS', { /* News options */ }]
        ]
    };

    const streams = await initStreams(options);

    // Now you can use the initialized streams
    console.log('Streams initialized:', streams);
    // Example: get next link from the first stream
    const firstStream = streams[0];
    const link = await firstStream.getNext();
    console.log('First link:', link);
}

main();
```

### API

#### `WordStream`

A stream that generates text from Wikipedia articles.

- **Constructor:** `new WordStream(word, lang)`
  - `word`: The starting word for the stream.
  - `lang`: The language of the Wikipedia articles.
- **Methods:**
  - `start()`: Initializes the stream.
  - `getNext()`: Returns the next text from the stream.

#### `NewsStream`

A stream that generates text from news articles.

- **Constructor:** `new NewsStream(options)`
  - `options`: Configuration options for the news stream.
- **Methods:**
  - `start()`: Initializes the stream.
  - `getNext()`: Returns the next text from the stream.

#### `initStreams(options)`

Initializes multiple streams based on the provided options.

- `options`: An object with the following properties:
  - `words`: An array where each element can be:
    - `[word, lang]` for a `WordStream`
    - `[':NEWS', options]` for a `NewsStream`
  - `circularLinkType`: (optional) Controls how links are processed:
    - Default: Prioritizes links by count, reducing count gradually
    - `'getNextClassic'`: Returns links in sequential order
    - `'getNextUnique'`: Returns only unique links, skipping duplicates

## License

🍺 This is beerware. If you like this code, buy me a beer sometime.