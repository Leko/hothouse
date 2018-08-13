// @flow
import fs from "fs";
import path from "path";
import glob from "glob";
import type { Structure, PackageManager } from "@hothouse/types";

const debug = require("debug")("hothouse:Structure:YarnWorkspaces");

class YarnWorkspaces implements Structure {
  async match(directory: string): Promise<boolean> {
    if (!fs.existsSync(path.join(directory, "package.json"))) {
      return false;
    }
    // $FlowFixMe(dynamic-require)
    const pkg = require(path.join(directory, "package.json"));
    return !!pkg.workspaces;
  }

  async getPackages(directory: string): Promise<Array<string>> {
    // $FlowFixMe(dynamic-require)
    const settings = require(path.join(directory, "package.json"));
    const globs = Array.isArray(settings.workspaces)
      ? settings.workspaces
      : settings.workspaces.packages;
    const children = globs.reduce((acc, pattern) => {
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
    await npmClient.install(rootDirectory);
    return this.getChanges(packageDirectory, rootDirectory);
  }

  async getChanges(
    packageDirectory: string,
    rootDirectory: string
  ): Promise<Set<string>> {
    // #88 package-lock.json should not be added nor committed if not exist
    return new Set(
      [
        path.join(packageDirectory, "package.json"),
        path.join(rootDirectory, "yarn.lock")
      ]
        .filter(fs.existsSync)
        .map(p => path.relative(rootDirectory, p))
    );
  }
}

module.exports = YarnWorkspaces;
