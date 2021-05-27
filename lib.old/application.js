"use strict";

const { node, npm, common } = require("./dependencies.js");
const { path, events, fs, vm } = node;

const { Interfaces } = require("./interfaces.js");
const { Modules } = require("./modules.js");
const { Resources } = require("./resources.js");

const { createContext } = require("./vm.js");
const watch = require("./watch.js");

class ApplicationError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

const SANDBOX = { Error, node, npm, common };

class Application extends events.EventEmitter {
  constructor() {
    super();
    this.initialization = true; // [ x ]
    this.finalization = false; // [ x ]
    this.root = process.cwd(); // [ x ]
    this.path = path.join(this.root, "application"); // [ x ]

    this.api = new Interfaces("api", this); // [ x ]
    this.static = new Resources("static", this); // [ x ]
    this.resources = new Resources("resources", this); // [ x ]
    this.lib = new Modules("lib", this); // [ x ]
    this.domain = new Modules("domain", this); // [ x ]

    this.starts = []; // [ x ]

    this.Application = Application; // [ x ]
    this.Error = ApplicationError; // [ x ]
    this.cert = null; // [ x ]
    this.config = null; // [ x ]
    this.logger = null; // [ x ]
    this.console = null; // [ x ]
    this.auth = null; // [ x ]
    this.watcher = null; // [ x ]
  }

  absolute(relative) {
    return path.join(this.path, relative);
  }

  async init() {
    this.startWatch();
    this.createSandbox();

    await Promise.allSettled([
      this.static.load(),
      this.resources.load(),
      this.api.load(),
      (async () => {
        await this.lib.load();
        await this.domain.load();
      })(),
    ]);
    await Promise.allSettled(this.starts.map((fn) => this.execute(fn)));

    this.starts = [];
    this.initialization = false;
  }

  async shutdown() {
    this.finalization = true;
    await this.stopPlace("domain");
    await this.stopPlace("lib");
    if (this.server) await this.server.close();
    await this.logger.close();
  }

  async stopPlace(name) {
    const place = this.sandbox[name];
    for (const moduleName of Object.keys(place)) {
      const module = place[moduleName];
      if (module.stop) await this.execute(module.stop);
    }
  }

  createSandbox() {
    const { auth, config, console, resources } = this;

    const { server: { host, port, protocol } = {} } = this;
    const worker = { id: "W" + node.worker.threadId.toString() };
    const server = { host, port, protocol };

    const application = { worker, server, auth, resources };
    application.introspect = async (interfaces) => this.introspect(interfaces);
    const sandbox = { ...SANDBOX, console, application, config };

    sandbox.api = {};
    sandbox.lib = this.lib.tree;
    sandbox.domain = this.domain.tree;

    this.sandbox = createContext(sandbox);
  }

  execute(method) {
    return method().catch((err) => {
      this.console.error(err.stack);
    });
  }

  startWatch() {
    const timeout = this.config.server.timeouts.watch;
    this.watcher = new watch.DirectoryWatcher({ timeout });

    this.watcher.on("change", (filePath) => {
      const relPath = filePath.substring(this.path.length + 1);
      const sepIndex = relPath.indexOf(path.sep);
      const place = relPath.substring(0, sepIndex);
      fs.stat(filePath, (err, stat) => {
        if (err) return;
        if (stat.isDirectory()) {
          this[place].load(filePath);
          return;
        }
        if (node.worker.threadId === 1) {
          this.console.debug("Reload: /" + relPath);
        }
        this[place].change(filePath);
      });
    });

    this.watcher.on("delete", async (filePath) => {
      const relPath = filePath.substring(this.path.length + 1);
      const sepIndex = relPath.indexOf(path.sep);
      const place = relPath.substring(0, sepIndex);
      this[place].delete(filePath);
      if (node.worker.threadId === 1) {
        this.console.debug("Deleted: /" + relPath);
      }
    });
  }

  introspect(interfaces) {
    const intro = {};
    for (const interfaceName of interfaces) {
      const [iname, ver = "*"] = interfaceName.split(".");
      const iface = this.api.collection[iname];
      if (!iface) continue;
      const version = ver === "*" ? iface.default : parseInt(ver);
      intro[iname] = this.api.signatures[iname + "." + version];
    }
    return intro;
  }

  getMethod(iname, ver, methodName) {
    const iface = this.api.collection[iname];
    if (!iface) return null;
    const version = ver === "*" ? iface.default : parseInt(ver, 10);
    const methods = iface[version.toString()];
    if (!methods) return null;
    const proc = methods[methodName];
    return proc;
  }

  getStaticFile(fileName) {
    return this.static.get(fileName);
  }
}

module.exports = new Application();
