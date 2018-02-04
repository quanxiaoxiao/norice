const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const swapFile = (tempPath, newPath) => {
  try {
    if (fs.existsSync(newPath)) {
      console.log('file exists');
      fs.unlinkSync(tempPath);
    } else {
      console.log(`create file: ${newPath}`);
      fs.renameSync(tempPath, newPath);
    }
  } catch (e) {
    console.error(e.message);
  }
};

const getFilePath = (dir, req) => {
  if (typeof dir === 'function') {
    return path.resolve(process.cwd(), dir(req));
  }
  return path.resolve(process.cwd(), dir);
};

const cryptoUsingMD5 = data =>
  crypto.createHash('md5').update(data).digest('hex');

module.exports = {
  swapFile,
  cryptoUsingMD5,
  getFilePath,
};
