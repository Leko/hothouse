// @flow
import fs from "fs";
import path from "path";
import cp from "child_process";
import glob from "glob";
import type { Structure, PackageManager } from "@hothouse/types";

const debug = require("debug")("hothouse:Structure:Lerna");

class Lerna implements Structure {
  async match(directory: string): Promise<boolean> {
    return fs.existsSync(path.join(directory, "lerna.json"));
  }

  async getPackages(directory: string): Promise<Array<string>> {
    // $FlowFixMe(dynamic-require)
    const settings = require(path.join(directory, "lerna.json"));
    const children = settings.packages.reduce((acc, pattern) => {
      const prefix = path.join(directory, pattern);
      return acc.concat(glob.sync(prefix, { absolute: true }));
    }, []);
    return [directory, ...children].filter(packagePath => {
      const isPackage = fs.existsSync(path.join(packagePath, "package.json"));
      if (!isPackage) {
        debug(
          `${path.relative(
            directory,
            packagePath
          )} is not a npm package. Ignored`
        );
      }
      return isPackage;
    });
  }

  async install(
    packageDirectory: string,
    rootDirectory: string,
    npmClient: PackageManager
  ): Promise<Set<string>> {
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

    return this.getChanges(packageDirectory, rootDirectory, npmClient);
  }

  async getChanges(
    packageDirectory: string,
    rootDirectory: string,
    npmClient: PackageManager
  ): Promise<Set<string>> {
    // #88 package-lock.json should not be added nor committed if not exist
    return new Set(
      [
        path.join(packageDirectory, "package.json"),
        path.join(packageDirectory, npmClient.getLockFileName())
      ]
        .filter(fs.existsSync)
        .map(p => path.relative(rootDirectory, p))
    );
  }
}

module.exports = Lerna;
