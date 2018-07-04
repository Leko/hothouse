// @flow
import fs from "fs";
import path from "path";
import semver from "semver";
import { fromUrl } from "hosted-git-info";
import normalize from "normalize-package-data";
import type { Update } from "@hothouse/types";

export const replaceSemver = (
  fromVersionRange: string,
  toVersion: string
): string => {
  const UPDATE_LIMITS = 200;
  const prefixRegEx = /^(\^|~|>=|>|<|<=)?\s*(.*)$/;
  if (!prefixRegEx.test(fromVersionRange)) {
    throw new Error(`Unsupported semver format: ${fromVersionRange}`);
  }
  // $FlowFixMe(already-tested)
  const [, prefix, fromVersion] = fromVersionRange.match(prefixRegEx);
  let updated = fromVersion;
  for (let i = 0; i < UPDATE_LIMITS; i++) {
    const diff = semver.diff(updated, toVersion);
    if (!diff) {
      break;
    }
    updated = semver.inc(updated, diff);
  }
  if (semver.diff(updated, toVersion)) {
    throw new Error(
      `Too many diffs to update to ${toVersion} from ${fromVersionRange}`
    );
  }
  return (prefix || "") + updated;
};

export default class Package {
  pkgJsonPath: string;
  pkgJson: Object;
  pkgJsonNormalized: Object;

  static createFromDirectory(dir: string): Package {
    return new Package(path.join(dir, "package.json"));
  }

  constructor(pkgJsonPath: string | Object) {
    if (typeof pkgJsonPath === "string") {
      this.pkgJsonPath = pkgJsonPath;
      // $FlowFixMe(dynamic-require)
      this.pkgJson = require(pkgJsonPath);
    } else {
      this.pkgJsonPath = "";
      this.pkgJson = pkgJsonPath;
    }

    this.pkgJsonNormalized = JSON.parse(JSON.stringify(this.pkgJson)); // Deep clone
    normalize(this.pkgJsonNormalized);
  }

  apply(update: Update): void {
    const deps = update.dev
      ? this.pkgJson.devDependencies
      : this.pkgJson.dependencies;

    deps[update.name] = replaceSemver(deps[update.name], update.latest);
  }

  getRepositoryHttpsUrl(): string {
    const gitHost = fromUrl(this.pkgJsonNormalized.repository.url);
    // https() returns git+https protocol always.
    return gitHost.https().replace("git+", "");
  }

  async save(): Promise<void> {
    fs.writeFileSync(this.pkgJsonPath, JSON.stringify(this.pkgJson, null, 2));
  }
}
