// @flow
import path from "path";
import minimatch from "minimatch";
import semver from "semver";
import filter from "lodash/filter";
import type {
  Hosting,
  PackageManager,
  Structure,
  Updates,
  UpdateDetails,
  GitImpl
} from "@hothouse/types";
import PackageManagerResolver from "./PackageManagerResolver";
import RepositoryStructureResolver from "./RepositoryStructureResolver";
import type UpdateChunk from "./UpdateChunk";
import { split } from "./UpdateChunk";
import hostings, { UnknownHosting } from "./Hosting";
import Package from "./Package";
import md2html from "./md2html";
import createCommitMessage from "./commitMessage";
import {
  createPullRequestTitle,
  createPullRequestMessage
} from "./pullRequest";

const debug = require("debug")("hothouse:Engine");

type EngineOptions = {|
  token: string,
  bail: boolean,
  ignore: Array<string>,
  perPackage: boolean,
  dryRun: boolean,
  packageManager: ?string,
  repositoryStructure: ?string,
  gitImpl: GitImpl
|};

export default class Engine {
  token: string;
  bail: boolean;
  ignore: Array<string>;
  perPackage: boolean;
  dryRun: boolean;
  repositoryStructureResolver: RepositoryStructureResolver;
  packageManagerResolver: PackageManagerResolver;
  gitImpl: GitImpl;

  constructor({
    token,
    bail,
    ignore,
    perPackage,
    dryRun,
    packageManager,
    repositoryStructure,
    gitImpl
  }: EngineOptions) {
    this.token = token;
    this.bail = bail;
    this.ignore = ignore;
    this.perPackage = perPackage;
    this.dryRun = dryRun;
    this.gitImpl = gitImpl;
    this.packageManagerResolver = new PackageManagerResolver(
      filter([packageManager, "@hothouse/client-yarn", "@hothouse/client-npm"])
    );
    this.repositoryStructureResolver = new RepositoryStructureResolver(
      filter([
        repositoryStructure,
        "@hothouse/monorepo-yarn-workspaces",
        "@hothouse/monorepo-lerna",
        "./SinglePackage"
      ])
    );

    debug(`dryRun=${String(dryRun)}`);
  }

  get logPrefix(): string {
    return this.dryRun ? "(dryRun) " : "";
  }

  async getPackageManager(dir: string): Promise<PackageManager> {
    return this.packageManagerResolver.detect(dir);
  }

  async run(directory: string): Promise<void> {
    const packageManager = await this.packageManagerResolver.detect(directory);
    const repositoryStructure = await this.repositoryStructureResolver.detect(
      directory
    );

    // FIXME: Parallelize
    const allUpdates = {};
    const packages = await repositoryStructure.getPackages(directory);
    for (let localPackage of packages) {
      const updates = await this.getUpdates(
        packageManager,
        localPackage,
        this.ignore
      );
      allUpdates[localPackage] = updates;
    }
    if (Object.keys(allUpdates).length === 0) {
      return;
    }

    const updateChunks = split(allUpdates, this.perPackage);
    debug(`Updates are:`, allUpdates);
    debug(`UpdateChunks are:`, updateChunks);

    for (let updateChunk of updateChunks) {
      const branchName = this.createBranchName(updateChunk);
      await this.inBranch(branchName, async () => {
        let allChangeSet: Set<string> = new Set([]);
        for (let localPackage of updateChunk.getPackagePaths()) {
          try {
            const updates = updateChunk.getUpdatesBy(localPackage);
            const changeSet = await this.applyUpdates(
              localPackage,
              directory,
              repositoryStructure,
              updates
            );
            debug(path.relative(directory, localPackage), changeSet);
            allChangeSet = new Set([...allChangeSet, ...changeSet]);
          } catch (error) {
            if (!this.bail) {
              throw error;
            }

            // eslint-disable-next-line no-console
            console.error(
              `An error occured during update ${path.basename(localPackage)}\n${
                error.stack
              }`
            );
          }
        }
        debug({ allChangeSet });
        // FIXME: refactor structure
        await this.commit(directory, updateChunk, allChangeSet, branchName);
        await this.createPullRequest(
          this.token,
          directory,
          updateChunk,
          branchName
        );
      });
    }
  }

  async getUpdates(
    packageManager: PackageManager,
    packageDirectory: string,
    blacklist: Array<string>
  ): Promise<Updates> {
    const updates = await packageManager.getUpdates(packageDirectory);
    return updates
      .filter(update => {
        if (semver.satisfies(update.latest, update.currentRange)) {
          debug(
            `${update.name}@${update.latest} covered in current semver range(${
              update.currentRange
            }). Ignored`
          );
          return false;
        }
        if (semver.lt(update.latest, update.current)) {
          debug(
            `${update.name}@${update.latest} less than current version(${
              update.current
            }). Ignored`
          );
          return false;
        }

        return true;
      })
      .filter(update => {
        if (!blacklist.every(name => !minimatch(name, update.name))) {
          debug(
            `${update.name}@${update.latest} match with black list. Ignored`
          );
          return false;
        }

        return true;
      });
  }

  async applyUpdates(
    packageDirectory: string,
    rootDirectory: string,
    repositoryStructure: Structure,
    updates: Updates
  ): Promise<Set<string>> {
    const pkg = Package.createFromDirectory(packageDirectory);
    const packageManager = await this.getPackageManager(rootDirectory);
    updates.forEach(update => {
      debug(
        `${this.logPrefix}Apply update (${update.name} ${update.current}->${
          update.latest
        }) to ${path.basename(packageDirectory)}:`,
        update
      );
      pkg.apply(update);
    });

    debug(`${this.logPrefix}Try to save: ${pkg.pkgJsonPath}`);
    debug(
      `${this.logPrefix}Try to update dependencies in ${path.basename(
        packageDirectory
      )} with ${packageManager.constructor.name}`
    );
    if (this.dryRun) {
      return new Set([]);
    }
    await pkg.save();
    return repositoryStructure.install(
      packageDirectory,
      rootDirectory,
      packageManager
    );
  }

  createBranchName(updateChunk: UpdateChunk): string {
    const now = new Date();
    const branchName = `hothouse-${[
      now.getFullYear(),
      String(now.getMonth()).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
      String(now.getHours()).padStart(2, "0"),
      String(now.getMinutes()).padStart(2, "0"),
      String(now.getSeconds()).padStart(2, "0")
    ].join("")}`;
    debug(`Branch name created: ${branchName} with ${now.toISOString()}`);
    return `${branchName}-${updateChunk.slugify()}`;
  }

  async inBranch(branchName: string, fn: () => any): Promise<void> {
    debug(`${this.logPrefix}Try to git operations in branch: ${branchName}`);
    if (this.dryRun) {
      return fn();
    } else {
      return this.gitImpl.inBranch(branchName, fn);
    }
  }

  async commit(
    rootDirectory: string,
    updateChunk: UpdateChunk,
    changeSet: Set<string>,
    branchName: string
  ): Promise<void> {
    // FIXME: Make customizable
    const message = createCommitMessage(updateChunk);

    debug(`${this.logPrefix}Try to git add .`);
    debug(`${this.logPrefix}Try to commit with message:`, { message });
    if (!this.dryRun) {
      await this.gitImpl.add(...changeSet);
      await this.gitImpl.commit(message);
    }
  }

  async createPullRequest(
    token: string,
    rootDirectory: string,
    updateChunk: UpdateChunk,
    branchName: string
  ): Promise<void> {
    // FIXME: Parallelise
    const changes: UpdateDetails = [];
    for (let pkgPath in updateChunk.allUpdates) {
      for (let update of updateChunk.allUpdates[pkgPath]) {
        const packageAnnotation = `${update.name}@${update.latest}`;
        const packageManager = await this.getPackageManager(rootDirectory);
        const meta = await packageManager.getPackageMeta(packageAnnotation);
        const pkg = new Package(meta);

        const currentTag = await this.getTag(
          packageManager,
          token,
          update.name,
          update.current
        );
        const latestTag = await this.getTag(
          packageManager,
          token,
          update.name,
          update.latest
        );
        debug(packageAnnotation, {
          currentTag,
          latestTag
        });
        changes.push({
          ...update,
          repositoryUrl: pkg.getRepositoryHttpsUrl(),
          compareUrl: await this.getCompareUrl(
            token,
            meta,
            currentTag,
            latestTag
          ),
          releaseNote: await this.getReleaseNote(token, meta, latestTag)
        });
      }
    }
    const title = createPullRequestTitle(changes);
    const body = createPullRequestMessage(changes);
    const repositoryUrl: string = Package.createFromDirectory(
      rootDirectory
    ).getRepositoryHttpsUrl();

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
      await this.gitImpl.push(token, repositoryUrl, branchName);
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

  async getTag(
    packageManager: PackageManager,
    token: string,
    packageName: string,
    version: string
  ): Promise<?string> {
    const packageAnnotation = `${packageName}@${version}`;
    debug(`Try to fetch tag ${packageAnnotation}`);

    try {
      const meta = await packageManager.getPackageMeta(packageAnnotation);
      const hosting = await this.detectHosting(meta);

      const commonTagNames = [`v${version}`, version];
      for (let tag of commonTagNames) {
        debug(`Check commonly named tag exists: ${tag}`);
        if (await hosting.tagExists(token, meta.repository.url, tag)) {
          debug(`Tag exists: ${tag}`);
          return tag;
        }
        debug(`${tag} is not exists`);
      }
      if (!meta.gitHead) {
        debug(
          `gitHead is not specified so cannot resolve tag name: ${packageAnnotation}`
        );
        return null;
      }
      debug(`Resolve tag by commit sha: ${meta.gitHead}`);
      return await hosting.shaToTag(token, meta.repository.url, meta.gitHead);
    } catch (error) {
      debug(
        `An error occured during fetch compare url in ${packageName}@${version}:`,
        error.stack
      );
      return null;
    }
  }

  async getCompareUrl(
    token: string,
    meta: Object,
    currentTag: ?string,
    latestTag: ?string
  ): Promise<?string> {
    if (!currentTag || !latestTag) {
      return null;
    }

    debug(`Try to fetch compare url ${meta.name}@${meta.version}`);
    try {
      const hosting = await this.detectHosting(meta);
      return await hosting.getCompareUrl(
        token,
        meta.repository.url,
        currentTag,
        latestTag
      );
    } catch (error) {
      debug(
        `An error occured during fetch compare url in ${meta.name}@${
          meta.version
        }:`,
        error.stack
      );
      return null;
    }
  }

  async getReleaseNote(
    token: string,
    meta: Object,
    latestTag: ?string
  ): Promise<?string> {
    if (!latestTag) {
      return null;
    }

    debug(`Try to fetch release note about ${meta.name} with tag ${latestTag}`);
    try {
      const hosting = await this.detectHosting(meta);
      const releaseNote = await hosting.tagToReleaseNote(
        token,
        meta.repository.url,
        latestTag
      );
      return releaseNote ? md2html(releaseNote) : null;
    } catch (error) {
      debug(
        `An error occured during fetch release note in ${meta.name}@${
          meta.version
        }:`,
        error.stack
      );
      return null;
    }
  }
}
