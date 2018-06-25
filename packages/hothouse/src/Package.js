// @flow
import fs from "fs";
import semver from "semver";

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
    const current = semver.coerce(deps[update.name]).version;

    deps[update.name] = deps[update.name].replace(current, update.latest);
  }

  async save(): Promise<void> {
    fs.writeFileSync(this.pkgJsonPath, JSON.stringify(this.pkgJson, null, 2));
  }
}
