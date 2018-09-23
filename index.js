const { Readable } = require('stream');

const data = ['aaa', 'bbb', 'ccc', 'ddd'];

const reader = new Readable({
  read: () => {
    setTimeout(() => {
      const chunk = data.pop();
      if (chunk) {
        reader.push(chunk);
      } else {
        reader.emit('error', 'aaa');
      }
    }, 1000);
  },
});

reader.on('close', () => {
  console.log('close');
});

reader.on('end', () => {
  console.log('end');
});

reader.on('error', () => {
  console.log('error');
  reader.destroy();
  setTimeout(() => {
    console.log(reader._readableState);
  }, 1000);
});

reader.on('data', (chunk) => {
  console.log('data', chunk.toString());
});
