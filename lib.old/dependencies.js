"use strict";

const system = {
  util: require("util"),
  childProcess: require("child_process"),
  worker: require("worker_threads"),
  os: require("os"),
  v8: require("v8"),
  vm: require("vm"),
};
const tools = {
  path: require("path"),
  url: require("url"),
  StringDecoder: require("string_decoder"),
  querystring: require("querystring"),
  assert: require("assert"),
};
const streams = {
  stream: require("stream"),
  fs: require("fs"),
  fsp: require("fs").promises,
  crypto: require("crypto"),
  zlib: require("zlib"),
  readline: require("readline"),
};
const async = {
  perfHooks: require("perf_hooks"),
  asyncHooks: require("async_hooks"),
  timers: require("timers"),
  events: require("events"),
};
const network = {
  dns: require("dns"),
  net: require("net"),
  tls: require("tls"),
  http: require("http"),
  https: require("https"),
  http2: require("http2"),
  dgram: require("dgram"),
};

const node = { process, ...system, ...tools, ...streams, ...async, ...network };
const npm = { ws: require("ws") };
const common = { Database: require("./database").Database };

Object.freeze(node);
Object.freeze(npm);
Object.freeze(npm);

module.exports = { node, npm, common };
