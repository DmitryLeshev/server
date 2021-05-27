"use strict";

const { node } = require("./dependencies.js");
const { fsp, path } = node;
const utils = require("./utils");

const { Cache } = require("./cache.js");

const win = process.platform === "win32";

class Resources extends Cache {
  constructor(place, application) {
    super(place, application);
    this.files = new Map();
  }

  get(key) {
    return this.files.get(key);
  }

  delete(filePath) {
    let key = filePath.substring(this.path.length);
    if (win) key = utils.replace(key, path.sep, "/");
    this.files.delete(key);
  }

  async change(filePath) {
    let key = filePath.substring(this.path.length);
    if (win) key = utils.replace(key, path.sep, "/");
    try {
      const data = await fsp.readFile(filePath);
      this.files.set(key, data);
    } catch (err) {
      if (err.code !== "ENOENT") {
        this.application.console.error(err.stack);
      }
    }
  }
}

module.exports = { Resources };
