const path = require('path');

exports.getFilePath = pathname => path.resolve(process.cwd(), pathname);
