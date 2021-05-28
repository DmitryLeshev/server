const config = require("../config");
const database = require("../database");
const logger = require("../logger");
const util = require("../util");
const vm = require("../vm");
const watch = require("../watch");
const server = require("../server");

const common = { config, database, logger, util, vm, watch, server };

module.exports = common;
