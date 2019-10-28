const { table } = require('table');

const data = [
  ['0A', '0B', '0C'],
  ['1A', '1B', '1C'],
  ['2A', '2B', '2C'],
];

const config = {};

const output = table(data, config);

console.log(output);
