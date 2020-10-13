'use strict'

const fs = require('fs').promises;
const path = require('path');

// Look for a file called $DATA_PATH if it exists. Otherwise, data.txt.
const dataPath = path.join(process.env.DATA_PATH || './data.txt');

// If the file exists, read it. Increment the number. Write it back.
fs.readFile(dataPath)
  .then(buffer => {
    const data = buffer.toString();
    console.log(data);
    writeTo(+data + 1);
  })
  .catch(e => {
    // If there's no file, create a new one containing a '0'.
    console.log('File not found. Writing "0" to a new file');
    writeTo(0);
  });

  const writeTo = data => {
    fs.writeFile(dataPath, data.toString()).catch(console.error);
  }
