"use strict";

const { Semaphore } = require("./semaphore.js");
const { Schema } = require("./schema.js");
const { createAbortController } = require("./utils.js");

const EMPTY_CONTEXT = Object.freeze({});

class Procedure {
  constructor(script, application) {
    const exp = script(EMPTY_CONTEXT);
    if (typeof exp === "object") {
      Object.assign(this, exp);
      const { parameters, returns, concurrency } = exp;
      if (parameters) this.parameters = Schema.from(parameters);
      if (returns) this.returns = Schema.from(returns);
      if (concurrency) this.semaphore = new Semaphore(concurrency, 0, 0);
    } else {
      this.method = exp;
    }
    this.script = script;
    this.application = application;
  }

  async enter() {
    await this.application.server.semaphore.enter();
    if (this.concurrency) {
      try {
        await this.semaphore.enter();
      } catch (err) {
        this.application.server.semaphore.leave();
        throw err;
      }
    }
  }

  leave() {
    this.application.server.semaphore.leave();
    if (this.concurrency) this.semaphore.leave();
  }

  async invoke(context, args = {}) {
    const { script, parameters, validate, returns, timeout } = this;
    const exp = script(context);
    const method = typeof exp === "object" ? exp.method : exp;
    if (parameters) {
      const { valid } = parameters.check(args);
      if (!valid) return new Error("Invalid parameter type");
    }
    if (validate) {
      validate(args);
    }
    let result;
    if (timeout) {
      const ac = createAbortController();
      result = await Promise.race([
        metautil.timeout(timeout, ac.signal),
        method(args),
      ]);
      ac.abort();
    } else {
      result = await method(args);
    }
    if (result instanceof this.application.Error) return result;
    if (returns) {
      const { valid } = this.returns.check(result);
      if (!valid) return new Error("Invalid result type");
    }
    return result;
  }
}

module.exports = { Procedure };
