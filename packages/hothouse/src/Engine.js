// @flow
import path from "path";
import cp from "child_process";
import minimatch from "minimatch";
import type {
  Hosting,
  Structure,
  PackageManager,
  Updates
} from "@hothouse/types";
import type UpdateChunk from "./UpdateChunk";
import hostings, { UnknownHosting } from "./Hosting";
import Package from "./Package";
import createCommitMessage from "./commitMessage";
import {
  createPullRequestTitle,
  createPullRequestMessage
} from "./pullRequest";

const debug = require("debug")("hothouse:Engine");

export default class Engine {
  repositoryStructure: Structure;
  packageManager: PackageManager;
  dryRun: boolean;

  constructor({
    packageManager,
    repositoryStructure,
    dryRun
  }: {
    packageManager: PackageManager,
    repositoryStructure: Structure,
    dryRun: boolean
  }) {
    this.repositoryStructure = repositoryStructure;
    this.packageManager = packageManager;
    this.dryRun = dryRun;

    debug(`dryRun=${String(dryRun)}`);
  }

  get logPrefix(): string {
    return this.dryRun ? "(dryRun) " : "";
  }

  async getPackages(directory: string): Promise<Array<string>> {
    return this.repositoryStructure.getPackages(directory);
  }

  async getUpdates(
    packageDirectory: string,
    blacklist: Array<string>
  ): Promise<Updates> {
    const updates = await this.packageManager.getUpdates(packageDirectory);
    return updates.filter(update =>
      blacklist.every(name => !minimatch(name, update.name))
    );
  }

  async applyUpdates(
    packageDirectory: string,
    rootDirectory: string,
    updates: Updates
  ): Promise<void> {
    const packageJsonPath = path.join(packageDirectory, "package.json");
    const pkg = new Package(packageJsonPath);
    updates.forEach(update => {
      debug(
        `${this.logPrefix}Apply update (${update.name} ${update.current}->${
          update.latest
        }) to ${path.basename(packageDirectory)}:`,
        update
      );
      pkg.apply(update);
    });

    debug(`${this.logPrefix}Try to save: ${packageJsonPath}`);
    debug(
      `${this.logPrefix}Try to update dependencies in ${path.basename(
        packageDirectory
      )} with ${this.packageManager.constructor.name}`
    );
    if (!this.dryRun) {
      await pkg.save();
      await this.repositoryStructure.install(
        packageDirectory,
        rootDirectory,
        this.packageManager
      );
    }
  }

  createBranchName(): string {
    const now = new Date();
    const branchName = `hothouse-update-${now.getFullYear()}${now.getMonth() +
      1}${now.getDate()}${now.getHours()}${now.getMinutes()}${now.getSeconds()}${now.getMilliseconds()}`;
    debug(`Branch name created: ${branchName} with ${now.toISOString()}`);
    return branchName;
  }

  async commit(
    rootDirectory: string,
    updateChunk: UpdateChunk,
    branchName: string
  ): Promise<void> {
    // FIXME: Make customizable
    const message = createCommitMessage(updateChunk);

    debug(`${this.logPrefix}Try to git add .`);
    debug(`${this.logPrefix}Try to git checkout -b ${branchName}`);
    debug(`${this.logPrefix}Try to commit with message:`, { message });
    if (!this.dryRun) {
      // FIXME: Filter files changed by hothouse
      cp.spawnSync("git", ["add", "."], {
        cwd: rootDirectory,
        stdio: "inherit"
      });
      cp.spawnSync("git", ["checkout", "-b", branchName], {
        cwd: rootDirectory,
        stdio: "inherit"
      });
      cp.spawnSync("git", ["commit", "--message", message], {
        cwd: rootDirectory,
        stdio: "inherit"
      });
    }
  }

  async createPullRequest(
    token: string,
    updateChunk: UpdateChunk,
    branchName: string
  ): Promise<void> {
    // FIXME: Parallelise
    const updateDetails: { [string]: Object } = {};
    for (let pkgPath in updateChunk.allUpdates) {
      for (let update of updateChunk.allUpdates[pkgPath]) {
        const currentTag = await this.getTag(
          token,
          `${update.name}@${update.current}`
        );
        const latestTag = await this.getTag(
          token,
          `${update.name}@${update.latest}`
        );

        const meta = await this.packageManager.getPackageMeta(
          `${update.name}@${update.latest}`
        );
        const hosting = await this.detectHosting(meta);
        const compareUrl = await hosting.getCompareUrl(
          token,
          meta.repository.url,
          currentTag,
          latestTag
        );
        const releaseNote = await hosting.tagToReleaseNote(
          token,
          meta.repository.url,
          latestTag
        );
        updateDetails[update.name] = {
          currentTag,
          latestTag,
          compareUrl,
          releaseNote
        };
      }
    }
    // $FlowFixMe(values-retuns-Updates)
    const updatesList: Array<Updates> = Object.values(updateChunk.allUpdates);
    const title = createPullRequestTitle(
      ...updatesList.reduce(
        (acc, updates) => acc.concat(updates.map(update => update.name)),
        []
      )
    );
    const body = createPullRequestMessage(updateChunk, updateDetails);
    const { stdout } = cp.spawnSync(
      "git",
      ["remote", "get-url", "--push", "origin"],
      {
        encoding: "utf8"
      }
    );
    // $FlowFixMe(stdout-is-string)
    const repositoryUrl: string = stdout;

    const hosting = await this.detectHosting({
      repository: { url: repositoryUrl }
    });
    const base = await hosting.getDefaultBranch(token, repositoryUrl);

    debug(`${this.logPrefix}Try to git push origin ${branchName}`);
    debug(`${this.logPrefix}Try to create PR:`, {
      repositoryUrl,
      base,
      branchName,
      title,
      body
    });
    if (!this.dryRun) {
      cp.spawnSync("git", ["push", "origin", branchName], {
        encoding: "utf8",
        stdio: "inherit"
      });
      await hosting.createPullRequest(
        token,
        repositoryUrl,
        base,
        branchName,
        title,
        body
      );
    }
  }

  async detectHosting(meta: Object): Promise<Hosting> {
    if (!meta.repository || !meta.repository.url) {
      return new UnknownHosting();
    }

    for (let hosting of hostings) {
      if (await hosting.match(meta.repository.url)) {
        return hosting;
      }
    }
    return new UnknownHosting();
  }

  async getTag(token: string, packageAnnotation: string): Promise<string> {
    const meta = await this.packageManager.getPackageMeta(packageAnnotation);
    const hosting = await this.detectHosting(meta);
    return hosting.shaToTag(token, meta.repository.url, meta.gitHead);
  }
}
