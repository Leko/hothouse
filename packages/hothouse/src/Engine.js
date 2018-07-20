// @flow
import path from "path";
import zipObject from "lodash/zipObject";
import type {
  PackageManager,
  Structure,
  Updates,
  UpdateDetails,
  ApplyResult,
  Reporter,
  GitImpl
} from "@hothouse/types";
import type UpdateChunk from "./UpdateChunk";
import { split } from "./UpdateChunk";
import Package from "./Package";
import configure from "./tasks/configure";
import createCommitMessage from "./commitMessage";
import WorkerPool from "./WorkerPool";
import * as actions from "./actions";

const debug = require("debug")("hothouse:Engine");

type EngineOptions = {|
  token: string,
  bail: boolean,
  ignore: Array<string>,
  perPackage: boolean,
  concurrency: number,
  dryRun: boolean,
  packageManager: ?string,
  repositoryStructure: ?string,
  reporter: Reporter,
  gitImpl: GitImpl
|};

export default class Engine {
  token: string;
  bail: boolean;
  ignore: Array<string>;
  perPackage: boolean;
  dryRun: boolean;
  concurrency: number;
  reporter: Reporter;
  gitImpl: GitImpl;
  packageManager: ?string;
  repositoryStructure: ?string;

  constructor({
    token,
    bail,
    ignore,
    perPackage,
    dryRun,
    concurrency,
    packageManager,
    repositoryStructure,
    reporter,
    gitImpl
  }: EngineOptions) {
    this.token = token;
    this.bail = bail;
    this.ignore = ignore;
    this.perPackage = perPackage;
    this.dryRun = dryRun;
    this.concurrency = concurrency;
    this.reporter = reporter;
    this.gitImpl = gitImpl;
    this.packageManager = packageManager;
    this.repositoryStructure = repositoryStructure;
    debug(`dryRun=${String(dryRun)}`);
  }

  get logPrefix(): string {
    return this.dryRun ? "(dryRun) " : "";
  }

  async run(directory: string): Promise<Array<ApplyResult>> {
    const config = {
      rootDirectory: directory,
      packageManager: this.packageManager,
      repositoryStructure: this.repositoryStructure,
      ignore: this.ignore,
      dryRun: this.dryRun,
      token: this.token
    };
    const {
      token,
      pkg,
      packageManager,
      repositoryStructure,
      hosting
    } = await configure(actions.configure(config));
    const pool = new WorkerPool({
      concurrency: this.concurrency,
      reporter: this.reporter
    });
    try {
      await pool.configure(config);

      const repositoryUrl: string = pkg.getRepositoryHttpsUrl();
      const baseBranch = await hosting.getDefaultBranch(token, repositoryUrl);
      const localPackages = await repositoryStructure.getPackages(directory);
      debug(`Found ${localPackages.length} packages:`, localPackages);

      const updatesList = await Promise.all(
        localPackages.map(localPackage =>
          pool.dispatch(actions.fetchUpdates(localPackage))
        )
      );
      const allUpdates = zipObject(localPackages, updatesList);
      await this.reporter.reportUpdates(directory, allUpdates);
      if (updatesList.every(updates => updates.length === 0)) {
        return [];
      }

      const chunks = split(allUpdates, this.perPackage);
      const updateDetails: Array<UpdateDetails> = await Promise.all(
        chunks.map(chunk => pool.dispatch(actions.fetchReleases(chunk)))
      );

      // FIXME: Parallelize
      const branches: Array<string> = [];
      for (let updateChunk of chunks) {
        const branchName = this.createBranchName(updateChunk);
        branches.push(branchName);
        await this.inBranch(branchName, async () => {
          let allChangeSet: Set<string> = new Set([]);
          for (let localPackage of updateChunk.getPackagePaths()) {
            try {
              const updates = updateChunk.getUpdatesBy(localPackage);
              if (updates.length === 0) {
                debug(`No updates available in: ${localPackage}. Skipped`);
                continue;
              }
              const changeSet = await this.applyUpdates(
                localPackage,
                directory,
                packageManager,
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
                `An error occured during update ${path.basename(
                  localPackage
                )}\n${error.stack}`
              );
            }
          }
          debug({ allChangeSet });
          // FIXME: refactor structure
          await this.commit(
            this.token,
            repositoryUrl,
            directory,
            updateChunk,
            allChangeSet,
            branchName
          );
        });
      }

      const results: Array<ApplyResult> = await Promise.all(
        chunks
          .map((chunk, i) => ({
            updateChunk: chunk,
            updateDetails: updateDetails[i],
            source: branches[i],
            base: baseBranch
          }))
          .map(payload => pool.dispatch(actions.applyUpdates(payload)))
      );
      await this.reporter.reportApplyResult(directory, results);

      return results;
    } finally {
      await pool.terminate();
    }
  }

  async applyUpdates(
    packageDirectory: string,
    rootDirectory: string,
    packageManager: PackageManager,
    repositoryStructure: Structure,
    updates: Updates
  ): Promise<Set<string>> {
    const pkg = Package.createFromDirectory(packageDirectory);
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
    token: string,
    repositoryUrl: string,
    rootDirectory: string,
    updateChunk: UpdateChunk,
    changeSet: Set<string>,
    branchName: string
  ): Promise<void> {
    // FIXME: Make customizable
    const message = createCommitMessage(updateChunk);

    debug(`${this.logPrefix}Try to git add .`);
    debug(`${this.logPrefix}Try to commit with message:`, { message });
    debug(`${this.logPrefix}Try to git push origin ${branchName}`);
    if (!this.dryRun) {
      await this.gitImpl.add(...changeSet);
      await this.gitImpl.commit(message);
      await this.gitImpl.push(token, repositoryUrl, branchName);
    }
  }
}
