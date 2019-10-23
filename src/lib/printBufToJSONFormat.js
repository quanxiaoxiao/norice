module.exports = (buf) => {
  try {
    const str = JSON.stringify(JSON.parse(buf.toString()), null, '  ');
    console.log(str);
  } catch (error) {
    console.log(error.message);
  }
};
