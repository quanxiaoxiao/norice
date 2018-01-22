const fs = require('fs');
const crypto = require('crypto');

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

const cryptoUsingMD5 = data =>
  crypto.createHash('md5').update(data).digest('hex');

module.exports = {
  swapFile,
  cryptoUsingMD5,
};
