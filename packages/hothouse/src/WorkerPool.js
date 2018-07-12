// @flow
import path from "path";
import times from "lodash/times";
import { Pool } from "threads";
import type { Reporter } from "@hothouse/types";
import type { Action } from "./actions";
import type { Config } from "./worker";
import * as actions from "./actions";

type WorkerInit = {|
  concurrency: number,
  reporter: Reporter
|};
export default class WorkerPool {
  options: WorkerInit;
  pool: Pool;

  constructor(options: WorkerInit) {
    const { concurrency, reporter } = options;

    this.options = options;
    this.pool = new Pool(concurrency);
    this.pool.on("error", e => reporter.reportError(e));
  }

  async configure(config: Config): Promise<void> {
    this.pool.run(path.resolve(__dirname, "worker.js"));
    const ready = times(this.options.concurrency, () =>
      this.dispatch(actions.configure(config))
    );
    return Promise.all(ready);
  }

  async dispatch<T>(action: Action): Promise<T> {
    return this.pool.send(action).promise();
  }

  async terminate(): Promise<void> {
    this.pool.killAll();
  }
}
