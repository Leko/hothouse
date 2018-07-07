// @flow
import type { GitImpl } from "@hothouse/types";
import type { CLIOptions } from "./options";
import Engine from "../Engine";

type RunningEnvironment = {
  cliOptions: CLIOptions,
  cwd: string,
  gitImpl: GitImpl
};

const debug = require("debug")("hothouse:cli");

const main = async (env: RunningEnvironment) => {
  debug(`CLI options are:`, env.cliOptions);
  const {
    token,
    bail,
    ignore,
    perPackage,
    dryRun,
    packageManager,
    repositoryStructure
  } = env.cliOptions;
  const packageManagers = [
    packageManager,
    "@hothouse/client-yarn",
    "@hothouse/client-npm"
  ];
  const repositoryStructures = [
    repositoryStructure,
    "@hothouse/monorepo-yarn-workspaces",
    "@hothouse/monorepo-lerna",
    "./SinglePackage"
  ];

  const engine = new Engine({
    token,
    bail,
    ignore,
    perPackage,
    packageManagers,
    repositoryStructures,
    dryRun,
    gitImpl: env.gitImpl
  });

  await engine.run(env.cwd);
};

export default main;
