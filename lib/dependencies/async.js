"use strict";

const async = {
  perfHooks: require("perf_hooks"),
  asyncHooks: require("async_hooks"),
  timers: require("timers"),
  events: require("events"),
};

module.exports = async;
