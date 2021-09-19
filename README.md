# Incremental build helper

Helps you decide if a file is newer than the last build time. This tool is made to reduce the repetitive work on the reader implementations.

## Usage

```js
import { IncrementalHelper } from '@static-pages/incremental';

const filesSpace = '/path/to/pages/**/*.md';
const incrementalFile = __dirname + '/buildinfo.json';

const incremental = new IncrementalHelper(filesSpace, incrementalFile);

const file = '/path/to/pages/my-markdown-file.md';

incremental.isNew(file) // boolean

incremental.fstat // cached fstat data of the `file`
```

## Notes
It creates a JSON file that tracks last execution times. Defaults to `.incremental` in the current working directory; can be customized with the second parameter of the constructor.
