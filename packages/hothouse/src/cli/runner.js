// @flow
import type { GitImpl, Reporter } from "@hothouse/types";
import type { CLIOptions } from "./options";
import Engine from "../Engine";

type RunningEnvironment = {
  cliOptions: CLIOptions,
  cwd: string,
  gitImpl: GitImpl,
  reporter: Reporter
};

const debug = require("debug")("hothouse:cli");

const main = async (env: RunningEnvironment) => {
  debug(`CLI options are:`, env.cliOptions);
  const {
    token,
    bail,
    ignore,
    perPackage,
    concurrency,
    dryRun,
    packageManager,
    repositoryStructure
  } = env.cliOptions;

  const engine = new Engine({
    token,
    bail,
    ignore,
    perPackage,
    packageManager,
    repositoryStructure,
    concurrency,
    dryRun,
    reporter: env.reporter,
    gitImpl: env.gitImpl
  });

  await engine.run(env.cwd);
};

export default main;
