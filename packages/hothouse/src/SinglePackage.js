// @flow
import fs from "fs";
import path from "path";
import type { Structure, PackageManager } from "@hothouse/types";

class SinglePackage implements Structure {
  async match(directory: string): Promise<boolean> {
    return fs.existsSync(path.join(directory, "package.json"));
  }

  async getPackages(directory: string): Promise<Array<string>> {
    return [directory];
  }

  async install(
    packageDirectory: string,
    rootDirectory: string,
    npmClient: PackageManager
  ): Promise<Set<string>> {
    await npmClient.install(packageDirectory);
    return this.getChanges(rootDirectory, npmClient);
  }

  async getChanges(
    rootDirectory: string,
    npmClient: PackageManager
  ): Promise<Set<string>> {
    // #88 package-lock.json should not be added nor committed if not exist
    return new Set(
      [
        path.join(rootDirectory, "package.json"),
        path.join(rootDirectory, npmClient.getLockFileName())
      ]
        .filter(fs.existsSync)
        .map(p => path.relative(rootDirectory, p))
    );
  }
}

module.exports = SinglePackage;
