// @flow
import fs from "fs";
import semver from "semver";
import type { Update } from "@hothouse/types";

export const replaceSemver = (
  fromVersion: string,
  toVersion: string
): string => {
  const current = semver.coerce(fromVersion).version;
  return fromVersion.replace(current, toVersion);
};

export default class Package {
  pkgJsonPath: string;
  pkgJson: Object;

  constructor(pkgJsonPath: string) {
    this.pkgJsonPath = pkgJsonPath;
    // $FlowFixMe(dynamic-require)
    this.pkgJson = require(pkgJsonPath);
  }

  apply(update: Update): void {
    const deps = update.dev
      ? this.pkgJson.devDependencies
      : this.pkgJson.dependencies;

    deps[update.name] = replaceSemver(deps[update.name], update.latest);
  }

  async save(): Promise<void> {
    fs.writeFileSync(this.pkgJsonPath, JSON.stringify(this.pkgJson, null, 2));
  }
}
