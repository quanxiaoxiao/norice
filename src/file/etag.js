const crypto = require('crypto');

const sha1 = (content) => {
  const hash = crypto.createHash('sha1');
  hash.update(content);
  return hash.digest();
};

const getSha1ListFromBuffer = (buffer) => {
  const blockSize = 1024 * 1024 * 4;
  const size = buffer.length;
  const sha1List = [];
  const blockCount = Math.ceil(size / blockSize);
  for (let i = 0; i < blockCount; i++) {
    sha1List.push(sha1(buffer.slice(i * blockSize, (i + 1) * blockSize)));
  }
  return sha1List;
};

const calcEtag = (buffer) => {
  let prefix = 0x16;
  const sha1List = getSha1ListFromBuffer(buffer);
  const count = sha1List.length;
  if (!count) {
    return 'Fto5o-5ea0sNMlW_75VgGJCv2AcJ';
  }
  let sha1Buffer = Buffer.concat(sha1List, count * 20);
  if (count > 1) {
    prefix = 0x91;
    sha1Buffer = sha1(sha1Buffer);
  }

  sha1Buffer = Buffer.concat(
    [Buffer.from([prefix]), sha1Buffer],
    sha1Buffer.length + 1,
  );
  return sha1Buffer.toString('base64')
    .replace(/\//g, '_')
    .replace(/\+/g, '-');
};

module.exports = calcEtag;
