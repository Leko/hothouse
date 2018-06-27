#!/usr/bin/env node
import yargs from "yargs";
import chalk from "chalk";
import { name, version } from "../package.json";
import App from "./App";
import PackageManagerResolver from "./PackageManagerResolver";

const options = yargs
  .version(version)
  .usage(`${name} -t xxxxx`)
  .option("ignore", {
    type: "string",
    description: "Comma separated package names to ignore updates",
    coerce: (ignore: string) =>
      ignore
        .split(",")
        .map(pkg => pkg.trim())
        .filter(pkg => !!pkg),
    default: ""
  })
  .option("per-package", {
    alias: "p",
    required: false,
    type: "boolean",
    description: "Send pull requests per package"
  })
  .option("token", {
    alias: "t",
    required: true,
    type: "string",
    description: "Access token of GitHub"
  }).argv;

const main = async (options, cwd) => {
  const pkgManagerResolver = new PackageManagerResolver([
    "@hothouse/client-yarn",
    "@hothouse/client-npm"
  ]);
  const pkgManager = pkgManagerResolver.detect(cwd);

  const { token, ignore, perPackage } = options;
  const [strategy] = await Promise.all([App.detectStructure(cwd)]);
  const app = new App(strategy, pkgManager);
  const branchName = app.createBranchName();

  // FIXME: Parallelize
  const allUpdates = {};
  for (let pkg of await app.getPackages(cwd)) {
    const updates = await app.getUpdates(pkg, ignore);
    if (updates.length === 0) {
      continue;
    }
    await app.applyUpdates(pkg, cwd, updates);
    if (perPackage) {
      for (let update of updates) {
        await app.commit(
          cwd,
          { [pkg]: [update] },
          `${branchName}-${update.name}`
        );
        await app.createPullRequest(
          token,
          { [update.name]: updates },
          `${branchName}-${update.name}`
        );
      }
    } else {
      allUpdates[pkg] = updates;
    }
  }
  if (Object.keys(allUpdates).length === 0) {
    return;
  }

  await app.commit(cwd, allUpdates, branchName);
  await app.createPullRequest(token, allUpdates, branchName);
};

main(options, process.cwd()).catch(e => {
  console.log(chalk.red(e.stack)); // eslint-disable-line no-console
  process.exit(1);
});
