// @flow
import path from "path";
import times from "lodash/times";
import { Pool } from "threads";
import type { Action } from "./actions";
import type { Config } from "./worker";
import * as actions from "./actions";

type WorkerInit = {|
  concurrency: number
|};
export default class WorkerPool {
  options: WorkerInit;
  pool: Pool;

  constructor(options: WorkerInit) {
    this.options = options;
    this.pool = new Pool(options.concurrency);
    this.pool.on("error", (job, error) => {
      console.error("Job errored:", job, error.stack);
    });
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
