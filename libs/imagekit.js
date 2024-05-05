const imageKit = require("imagekit");
const { IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_ENDPOINT_URL } =
  process.env;

module.exports = new imageKit({
  publicKey: IMAGEKIT_PUBLIC_KEY,
  privateKey: IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: IMAGEKIT_ENDPOINT_URL,
});
