// @flow
import { EOL } from "os";
import fs from "fs";
import path from "path";
import zipObject from "lodash/zipObject";
import cp from "child_process";
import type { PackageManager, Update, Updates } from "@hothouse/types";
import Lerna from "@hothouse/monorepo-lerna";
import YarnWorkspaces from "@hothouse/monorepo-yarn-workspaces";

const debug = require("debug")("hothouse:NpmClient:Yarn");
const lerna = new Lerna();
const yarnWorkspaces = new YarnWorkspaces();

type YarnOutdated = {|
  Package: string,
  Current: string,
  Latest: string,
  "Package Type": string,
  Workspace?: string
|};

class Yarn implements PackageManager {
  async match(directory: string): Promise<boolean> {
    if (await yarnWorkspaces.match(directory)) {
      return true;
    }
    if (await lerna.match(directory)) {
      // $FlowFixMe(dynamic-require)
      const settings = require(path.join(directory, "lerna.json"));
      return settings.npmClient === "yarn";
    }

    return fs.existsSync(path.join(directory, "yarn.lock"));
  }

  getLockFileName(): string {
    return "yarn.lock";
  }

  async getUpdates(packageDirectory: string): Promise<Updates> {
    // $FlowFixMe(dynamic-require)
    const pkg = require(path.join(packageDirectory, "package.json"));
    const outdated = this.getOutdated(packageDirectory);

    return outdated
      .filter(row => this.filterRow(row, pkg))
      .map(row => this.toUpdate(row, pkg));
  }

  async install(packageDirectory: string): Promise<void> {
    const result = cp.spawnSync("yarn", ["install"], {
      cwd: packageDirectory,
      encoding: "utf8"
    });
    if (result.error) {
      throw result.error;
    }
    if (result.status !== 0) {
      throw new Error(result.stderr);
    }
  }

  async getPackageMeta(packageName: string): Promise<Object> {
    const result = cp.spawnSync("yarn", ["info", "--json", packageName], {
      encoding: "utf8"
    });

    // $FlowFixMe(stdio-is-string)
    return JSON.parse(result.stdout).data;
  }

  getOutdated(packageDirectory: string) {
    const result = cp.spawnSync("yarn", ["outdated", "--json"], {
      cwd: packageDirectory,
      encoding: "utf8"
    });
    if (result.stdout === "") {
      return [];
    }

    // $FlowFixMe(stdout-is-string)
    const output = `${result.stdout}\n${result.stderr}`;
    const lines = this.parseLineJson(output);
    lines.forEach(line => {
      if (line.type === "error") {
        throw new Error(line.data);
      }
    });
    const table = lines.find(line => line.type === "table");
    if (!table) {
      throw new Error(`Cannot find outdated results in:\n${output}`);
    }
    return this.parseOutdated(table.data);
  }

  parseLineJson(lines: string): Array<Object> {
    return lines
      .split(EOL)
      .filter(line => line.trim().length)
      .map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          debug(`Failed to parse as JSON: ${line}. Ignored`);
          // $FlowFixMe(filterd-after)
          return null;
        }
      })
      .filter(line => line !== null);
  }

  parseOutdated(table: {
    head: Array<string>,
    body: Array<Array<string>>
  }): Array<YarnOutdated> {
    return table.body.map(row => zipObject(table.head, row));
  }

  toUpdate(outdated: YarnOutdated, pkg: Object): Update {
    const {
      Package: name,
      Current: current,
      Latest: latest,
      "Package Type": type
    } = outdated;

    return {
      name,
      current,
      latest,
      currentRange: pkg[type][name],
      dev: type !== "dependencies"
    };
  }

  filterRow(
    { Package, Latest, Workspace }: YarnOutdated,
    pkg: Object
  ): boolean {
    // exotic: local package
    if (Latest === "exotic") {
      debug(`${Package} is linked package. Ignored`);
      return false;
    }
    // Yarn workspaces include other package updates
    if (Workspace && Workspace !== pkg.name) {
      debug(`${Package} is outside dependency of ${pkg.name}. Ignored`);
      return false;
    }
    return true;
  }
}

module.exports = Yarn;
