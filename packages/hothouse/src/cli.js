#!/usr/bin/env node
import chalk from "chalk";
import Engine from "./Engine";
import PackageManagerResolver from "./PackageManagerResolver";
import RepositoryStructureResolver from "./RepositoryStructureResolver";
import { split } from "./UpdateChunk";
import cliOptions, { type CLIOptions } from "./cliOptions";

const debug = require("debug")("hothouse:cli");

const main = async (options: CLIOptions, cwd) => {
  debug(`CLI options are:`, options);
  const { token, ignore, perPackage, dryRun } = options;

  const pkgManagerResolver = new PackageManagerResolver([
    "@hothouse/client-yarn",
    "@hothouse/client-npm"
  ]);
  const structureResolver = new RepositoryStructureResolver([
    "@hothouse/monorepo-yarn-workspaces",
    "@hothouse/monorepo-lerna",
    "./SinglePackage"
  ]);

  const packageManager = await pkgManagerResolver.detect(cwd);
  const repositoryStructure = await structureResolver.detect(cwd);
  const engine = new Engine({
    packageManager,
    repositoryStructure,
    dryRun
  });
  const branchName = engine.createBranchName();

  // FIXME: Parallelize
  const allUpdates = {};
  for (let localPackage of await engine.getPackages(cwd)) {
    const updates = await engine.getUpdates(localPackage, ignore);
    allUpdates[localPackage] = updates;
  }
  if (Object.keys(allUpdates).length === 0) {
    return;
  }

  const updateChunks = split(allUpdates, perPackage);
  debug(`Updates are:`, allUpdates);
  debug(`UpdateChunks are:`, updateChunks);

  for (let updateChunk of updateChunks) {
    for (let localPackage of updateChunk.getPackagePaths()) {
      await engine.applyUpdates(
        localPackage,
        cwd,
        updateChunk.getUpdatesBy(localPackage)
      );
    }
    // FIXME: refactor structure
    await engine.commit(cwd, updateChunk, branchName);
    await engine.createPullRequest(token, updateChunk, branchName);
  }
};

main(cliOptions.argv, process.cwd()).catch(e => {
  console.log(chalk.red(e.stack)); // eslint-disable-line no-console
  process.exit(1);
});
