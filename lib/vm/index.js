"use strict";

const vm = require("./vm.js");
const loader = require("./loader.js");

module.exports = { ...vm, ...loader };
