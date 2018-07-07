#!/usr/bin/env node
import chalk from "chalk";
import Engine from "./Engine";
import { bugs } from "../package.json";
import cliOptions, { type CLIOptions } from "./cliOptions";
import git from "./git";
import { InternalError } from "./errors";

const debug = require("debug")("hothouse:cli");

const main = async (options: CLIOptions, cwd) => {
  debug(`CLI options are:`, options);
  const {
    token,
    bail,
    ignore,
    perPackage,
    dryRun,
    packageManager,
    repositoryStructure
  } = options;
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
    gitImpl: git
  });

  await engine.run(cwd);
};

main(cliOptions.argv, process.cwd()).catch(e => {
  console.error(chalk.red(e.stack)); // eslint-disable-line no-console
  if (e instanceof InternalError) {
    // eslint-disable-next-line no-console
    console.error(
      `\nIt's internal bug.\nPlease report issue from here: ${bugs.url}`
    );
  }
  process.exit(1);
});
