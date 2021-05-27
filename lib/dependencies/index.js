const system = require("./system.js");
const tools = require("./tools.js");
const streams = require("./streams.js");
const async = require("./async.js");
const network = require("./network.js");

const node = { process, ...system, ...tools, ...streams, ...async, ...network };
const npm = { ws: require("ws") };
const common = require("./common.js");

Object.freeze(node);
Object.freeze(npm);
Object.freeze(common);

module.exports = { node, npm, common };
