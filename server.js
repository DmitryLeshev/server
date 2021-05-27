"use strict";

const { Worker } = require("worker_threads");
const path = require("path");

const { Config } = require("./lib/config");

const vm = require("./lib/vm");

const util = require("./lib/util");

const { Logger } = require("./lib/logger");

const PATH = process.cwd();
const CFG_PATH = path.join(PATH, "application/config");
const LOG_PATH = path.join(PATH, "log");
const CTRL_C = 3;

(async () => {
  const logOpt = { path: LOG_PATH, workerId: 0, toFile: [] };
  const { console } = await new Logger(logOpt);

  const exit = (message) => {
    console.error(util.replace(message, PATH, ""));
    process.exit(1);
  };

  const context = vm.createContext({ process });
  const options = { mode: process.env.MODE, context };
  const config = await new Config(CFG_PATH, options).catch((err) => {
    exit(`Can not read configuration: ${CFG_PATH}\n${err.stack}`);
  });

  const { balancer, ports = [], workers = {} } = config.server;
  const count = ports.length + (balancer ? 1 : 0) + (workers.pool || 0);
  let startTimer = null;
  let active = 0;
  let starting = 0;
  const threads = new Array(count);

  const stop = async () => {
    for (const worker of threads) {
      worker.postMessage({ type: "event", name: "stop" });
    }
  };

  const start = (id) => {
    const workerPath = path.join(__dirname, "lib/worker.js");
    const worker = new Worker(workerPath, { trackUnmanagedFds: true });
    threads[id] = worker;

    worker.on("exit", (code) => {
      if (code !== 0) start(id);
      else if (--active === 0) process.exit(0);
    });

    worker.on("online", () => {
      if (++starting === count) {
        startTimer = setTimeout(() => {
          if (active !== count) console.warn("Server initialization timed out");
        }, config.server.timeouts.start);
      }
    });

    worker.on("message", (data) => {
      if (data.type === "event" && data.name === "started") active++;
      if (active === count && startTimer) {
        clearTimeout(startTimer);
        startTimer = null;
      }
    });
  };

  for (let id = 0; id < count; id++) start(id);

  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.on("data", (data) => {
      const key = data[0];
      if (key === CTRL_C) stop();
    });
  }
})();
