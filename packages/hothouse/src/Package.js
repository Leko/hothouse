// @flow
import fs from "fs";
import path from "path";
import { fromUrl } from "hosted-git-info";
import normalize from "normalize-package-data";
import type { Update } from "@hothouse/types";
import { replace } from "./utils/semver";

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

    deps[update.name] = replace(deps[update.name], update.latest);
  }

  hasRepositoryUrl(): boolean {
    const { repository } = this.pkgJsonNormalized;
    return repository && repository.url;
  }

  getRepositoryHttpsUrl(): string {
    if (!this.hasRepositoryUrl()) {
      throw new Error(
        `repository.url is not defined in ${this.pkgJsonPath ||
          this.pkgJsonNormalized.name}`
      );
    }
    if (/^https:/.test(this.pkgJsonNormalized.repository.url)) {
      return this.pkgJsonNormalized.repository.url;
    }

    // https() returns git+https protocol always.
    const gitHost = fromUrl(this.pkgJsonNormalized.repository.url);
    return gitHost.https().replace("git+", "");
  }

  async save(): Promise<void> {
    const json = JSON.stringify(this.pkgJson, null, 2) + "\n";
    fs.writeFileSync(this.pkgJsonPath, json);
  }
}
