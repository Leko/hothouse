// @flow
import fs from "fs";
import path from "path";
import cp from "child_process";
import glob from "glob";

export default class Lerna implements Structure {
  async match(directory: string): Promise<boolean> {
    return fs.existsSync(path.join(directory, "lerna.json"));
  }

  async getPackages(directory: string): Promise<Array<string>> {
    // $FlowFixMe(dynamic-require)
    const settings = require(path.join(directory, "lerna.json"));
    return settings.packages.reduce(
      (acc, pkg) => acc.concat(glob.sync(pkg, { absolute: true })),
      []
    );
  }

  async install(
    packageDirectory: string,
    rootDirectory: string,
    npmClient: NpmClient
  ): Promise<void> {
    const result = cp.spawnSync("npx", ["lerna", "bootstrap"], {
      encoding: "utf8",
      cwd: rootDirectory,
      stdio: "inherit"
    });
    if (result.error) {
      throw result.error;
    }
    if (result.status !== 0) {
      throw new Error(result.stderr);
    }
  }
}
