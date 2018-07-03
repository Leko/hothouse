// @flow
import fs from "fs";
import path from "path";
import cp from "child_process";
import type { PackageManager, Updates } from "@hothouse/types";

class Npm implements PackageManager {
  async match(directory: string): Promise<boolean> {
    return fs.existsSync(path.join(directory, "package.json"));
  }

  getLockFileName(): string {
    return "package-lock.json";
  }

  async getUpdates(packageDirectory: string): Promise<Updates> {
    // $FlowFixMe(dynamic-require)
    const pkg = require(path.join(packageDirectory, "package.json"));
    const result = cp.spawnSync("npm", ["outdated", "--json"], {
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
      .reduce((acc, [name, outdated]: [string, Outdated]) => {
        const inDev = !!(pkg.devDependencies && pkg.devDependencies[name]);
        return acc.concat({
          name,
          current: outdated.current,
          currentRange: pkg[inDev ? "devDependencies" : "dependencies"][name],
          latest: outdated.latest,
          dev: inDev
        });
      }, []);
  }

  async install(packageDirectory: string): Promise<void> {
    const result = cp.spawnSync("npm", ["install"], {
      cwd: packageDirectory,
      encoding: "utf8"
    });
    if (result.error) {
      throw result.error;
    }
    if (result.status !== 0) {
      throw new Error(result.stderr);
    }
  }

  async getPackageMeta(packageName: string): Promise<Object> {
    const result = cp.spawnSync("npm", ["show", "--json", packageName], {
      encoding: "utf8"
    });

    // $FlowFixMe(stdio-is-string)
    return JSON.parse(result.stdout);
  }
}

module.exports = Npm;
