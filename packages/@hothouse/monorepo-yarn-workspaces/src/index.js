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
    const settings = require(path.join(directory, "lerna.json"));
    return settings.packages
      .reduce((acc, pkg) => acc.concat(glob.sync(pkg, { absolute: true })), [])
      .filter(packagePath => {
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
    return new Set(["package.json", "yarn.lock"]);
  }
}

module.exports = YarnWorkspaces;
