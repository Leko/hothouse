// @flow
import { EOL } from "os";
import fs from "fs";
import path from "path";
import zipObject from "lodash/zipObject";
import cp from "child_process";
import type { PackageManager, Updates } from "@hothouse/types";
import Lerna from "@hothouse/monorepo-lerna";
import YarnWorkspaces from "@hothouse/monorepo-yarn-workspaces";

const lerna = new Lerna();
const yarnWorkspaces = new YarnWorkspaces();

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
    const result = cp.spawnSync("yarn", ["outdated", "--json"], {
      cwd: packageDirectory,
      encoding: "utf8"
    });
    if (result.stdout === "") {
      return [];
    }

    // $FlowFixMe(stdout-is-string)
    const lines = `${result.stdout}\n${result.stderr}`
      .split(EOL)
      .filter(line => line.trim().length)
      .map(line => JSON.parse(line));
    const updates = lines.filter(line => {
      if (line.type === "error") {
        throw new Error(line.data);
      }
      return line.type === "table";
    });
    const outdated = updates.reduce((acc, table) => {
      const rows = table.data.body.map(row => zipObject(table.data.head, row));
      const updates = rows
        .filter(row => this.filterRow(row, pkg))
        .map(
          ({
            Package: name,
            Current: current,
            Latest: latest,
            "Package Type": type
          }) => ({
            name,
            current,
            latest,
            currentRange: pkg[type][name],
            dev: type !== "dependencies"
          })
        );

      return acc.concat(updates);
    }, []);
    return outdated;
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

  filterRow({ Latest, Workspace }: Object, pkg: Object): boolean {
    return Latest !== "exotic" && (Workspace && Workspace === pkg.name);
  }
}

module.exports = Yarn;
