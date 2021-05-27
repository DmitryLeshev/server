"use strict";

const network = {
  dns: require("dns"),
  net: require("net"),
  tls: require("tls"),
  http: require("http"),
  https: require("https"),
  http2: require("http2"),
  dgram: require("dgram"),
};

module.exports = network;
