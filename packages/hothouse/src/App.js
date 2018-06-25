// @flow
import path from "path";
import cp from "child_process";
import minimatch from "minimatch";
import structures, { SinglePackage } from "./Structure";
import npmClients, { Npm } from "./NpmClient";
import hostings, { UnknownHosting } from "./Hosting";
import Package from "./Package";
import createCommitMessage from "./commitMessage";
import {
  createPullRequestTitle,
  createPullRequestMessage
} from "./pullRequest";

export default class App {
  structure: Structure;
  npmClient: NpmClient;

  static async detectStructure(directory: string): Promise<Structure> {
    for (let structure of structures) {
      if (await structure.match(directory)) {
        return structure;
      }
    }
    return new SinglePackage();
  }

  static async detectClient(directory: string): Promise<NpmClient> {
    for (let npmClient of npmClients) {
      if (await npmClient.match(directory)) {
        return npmClient;
      }
    }
    return new Npm();
  }

  constructor(structure: Structure, npmClient: NpmClient) {
    this.structure = structure;
    this.npmClient = npmClient;
  }

  async getPackages(directory: string): Promise<Array<string>> {
    return this.structure.getPackages(directory);
  }

  async getUpdates(
    packageDirectory: string,
    blacklist: Array<string>
  ): Promise<Updates> {
    const updates = await this.npmClient.getUpdates(packageDirectory);
    return updates.filter(update =>
      blacklist.every(name => !minimatch(name, update.name))
    );
  }

  async applyUpdates(
    packageDirectory: string,
    rootDirectory: string,
    updates: Updates
  ): Promise<void> {
    const pkg = new Package(path.join(packageDirectory, "package.json"));
    updates.forEach(update => pkg.apply(update));
    await pkg.save();
    return this.structure.install(
      packageDirectory,
      rootDirectory,
      this.npmClient
    );
  }

  createBranchName(): string {
    const now = new Date();
    return `hothouse-update-${now.getFullYear()}${now.getMonth() +
      1}${now.getDate()}${now.getHours()}${now.getMinutes()}${now.getSeconds()}${now.getMilliseconds()}`;
  }

  async commit(
    rootDirectory: string,
    allUpdates: { [string]: Updates },
    branchName: string
  ): Promise<void> {
    // FIXME: Filter files changed by hothouse
    cp.spawnSync("git", ["add", "."], {
      cwd: rootDirectory,
      stdio: "inherit"
    });
    cp.spawnSync("git", ["checkout", "-b", branchName], {
      cwd: rootDirectory,
      stdio: "inherit"
    });

    // FIXME: Make customizable
    const message = createCommitMessage(allUpdates);
    cp.spawnSync("git", ["commit", "--message", message], {
      cwd: rootDirectory,
      stdio: "inherit"
    });
  }

  async createPullRequest(
    token: string,
    allUpdates: { [string]: Updates },
    branchName: string
  ): Promise<void> {
    // FIXME: Parallelise
    const updateDetails: { [string]: Object } = {};
    for (let pkgPath in allUpdates) {
      for (let update of allUpdates[pkgPath]) {
        const currentTag = await this.getTag(
          token,
          `${update.name}@${update.current}`
        );
        const latestTag = await this.getTag(
          token,
          `${update.name}@${update.latest}`
        );

        const meta = await this.npmClient.getPackageMeta(
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
    const title = createPullRequestTitle(
      Object.values(allUpdates).reduce(
        (acc, updates) => acc.concat(updates.map(update => update.name)),
        []
      )
    );
    const body = createPullRequestMessage(allUpdates, updateDetails);
    cp.spawnSync("git", ["push", "origin", branchName], {
      encoding: "utf8",
      stdio: "inherit"
    });

    const { stdout: repositoryUrl } = cp.spawnSync(
      "git",
      ["remote", "get-url", "--push", "origin"],
      {
        encoding: "utf8",
        stdio: "inherit"
      }
    );
    const hosting = await this.detectHosting({
      repository: { url: repositoryUrl }
    });
    console.log({ hosting }, hosting.getDefaultBranch);
    const base = await hosting.getDefaultBranch(token, repositoryUrl);
    await hosting.createPullRequest(
      token,
      repositoryUrl,
      base,
      branchName,
      title,
      body
    );
  }

  async detectHosting(meta: Object): Promise<Hosting> {
    if (!meta.repository || !meta.repository.url) {
      return new UnknownHosting();
    }

    for (let hosting of hostings) {
      console.log({ url: meta.repository.url });
      if (await hosting.match(meta.repository.url)) {
        return hosting;
      }
    }
    return new UnknownHosting();
  }

  async getTag(token: string, packageAnnotation: string): Promise<string> {
    const meta = await this.npmClient.getPackageMeta(packageAnnotation);
    const hosting = await this.detectHosting(meta);
    return hosting.shaToTag(token, meta.repository.url, meta.gitHead);
  }
}
