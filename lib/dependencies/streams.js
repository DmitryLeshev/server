"use strict";

const streams = {
  stream: require("stream"),
  fs: require("fs"),
  fsp: require("fs").promises,
  crypto: require("crypto"),
  zlib: require("zlib"),
  readline: require("readline"),
};

module.exports = streams;
