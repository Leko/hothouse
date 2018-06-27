// @flow
import fs from "fs";
import path from "path";
import cp from "child_process";
import type { PackageManager, Updates } from "@hothouse/types";

export default class Npm implements PackageManager {
  async match(directory: string): Promise<boolean> {
    return fs.existsSync(path.join(directory, "package.json"));
  }

  async getUpdates(packageDirectory: string): Promise<Updates> {
    // $FlowFixMe(dynamic-require)
    const pkg = require(path.join(packageDirectory, "package.json"));
    const result = cp.spawnSync("npm", ["outdated", "--json"], {
      cwd: packageDirectory,
      encoding: "utf8"
    });
    // $FlowFixMe(stdout-is-string)
    const outdated: { [string]: Outdated } = JSON.parse(result.stdout);
    // $FlowFixMe(entries-returns-mixed)
    const outdatedPackages: Array<[string, Outdated]> = Object.entries(
      outdated
    );
    return outdatedPackages.reduce(
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
    const result = cp.spawnSync("npm", ["install"], {
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
    const result = cp.spawnSync("npm", ["show", "--json", packageName], {
      encoding: "utf8"
    });

    // $FlowFixMe(stdio-is-string)
    return JSON.parse(result.stdout);
  }
}
