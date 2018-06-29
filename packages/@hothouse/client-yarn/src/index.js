// @flow
import fs from "fs";
import path from "path";
import cp from "child_process";
import type { PackageManager, Updates } from "@hothouse/types";
import Lerna from "@hothouse/monorepo-lerna";
import YarnWorkspaces from "@hothouse/monorepo-yarn-workspaces";

const debug = require("debug")("hothouse:PackageManager:Yarn");
const lerna = new Lerna();
const yarnWorkspaces = new YarnWorkspaces();

class Yarn implements PackageManager {
  async match(directory: string): Promise<boolean> {
    if (await yarnWorkspaces.match(directory)) {
      return true;
    }
    if (await lerna.match(directory)) {
      // $FlowFixMe(dynamic-require)
      const settings = require(path.join(directory, "lerna.json"));
      return settings.npmClient === "yarn";
    }

    return fs.existsSync(path.join(directory, "yarn.lock"));
  }

  async getUpdates(packageDirectory: string): Promise<Updates> {
    // $FlowFixMe(dynamic-require)
    const pkg = require(path.join(packageDirectory, "package.json"));
    const result = cp.spawnSync("yarn", ["outdated", "--json"], {
      cwd: packageDirectory,
      encoding: "utf8"
    });
    if (result.stdout === "") {
      return [];
    }

    // $FlowFixMe(stdout-is-string)
    const outdated: { [string]: Outdated } = JSON.parse(result.stdout);
    // $FlowFixMe(entries-returns-mixed)
    const outdatedPackages: Array<[string, Outdated]> = Object.entries(
      outdated
    );
    return outdatedPackages
      .filter(
        ([name, outdated]: [string, Outdated]) => outdated.latest !== "linked"
      )
      .reduce(
        (acc, [name, outdated]: [string, Outdated]) =>
          acc.concat({
            name,
            current: outdated.current,
            latest: outdated.latest,
            dev: !!(pkg.devDependencies && pkg.devDependencies[name])
          }),
        []
      );
  }

  async install(packageDirectory: string): Promise<void> {
    const result = cp.spawnSync("yarn", ["install"], {
      cwd: packageDirectory,
      encoding: "utf8",
      stdio: "inherit"
    });
    if (result.error) {
      throw result.error;
    }
    if (result.status !== 0) {
      throw new Error(result.stderr);
    }
  }

  async getPackageMeta(packageName: string): Promise<Object> {
    const result = cp.spawnSync("yarn", ["info", "--json", packageName], {
      encoding: "utf8"
    });

    // $FlowFixMe(stdio-is-string)
    return JSON.parse(result.stdout);
  }
}

module.exports = Yarn;
