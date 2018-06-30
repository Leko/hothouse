#!/usr/bin/env node
import path from "path";
import chalk from "chalk";
import Engine from "./Engine";
import PackageManagerResolver from "./PackageManagerResolver";
import RepositoryStructureResolver from "./RepositoryStructureResolver";
import { split } from "./UpdateChunk";
import { bugs } from "../package.json";
import cliOptions, { type CLIOptions } from "./cliOptions";

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

  const pkgManagerResolver = new PackageManagerResolver(
    [packageManager, "@hothouse/client-yarn", "@hothouse/client-npm"].filter(
      plugin => !!plugin
    )
  );
  const structureResolver = new RepositoryStructureResolver(
    [
      repositoryStructure,
      "@hothouse/monorepo-yarn-workspaces",
      "@hothouse/monorepo-lerna",
      "./SinglePackage"
    ].filter(plugin => !!plugin)
  );

  const engine = new Engine({
    packageManager: await pkgManagerResolver.detect(cwd),
    repositoryStructure: await structureResolver.detect(cwd),
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
      try {
        const updates = updateChunk.getUpdatesBy(localPackage);
        await engine.applyUpdates(
          localPackage,
          cwd,
          updateChunk.getUpdatesBy(updates)
        );
      } catch (error) {
        if (!bail) {
          throw error;
        }
        console.error(
          `An error occured during update ${path.basename(
            localPackage
          )}.\nIt's internal bug.\nPlease report issue from here: ${
            bugs.url
          }\n\n${error.stack}`
        );
      }
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
