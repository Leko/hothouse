// @flow

export type Semver = string;
export type Outdated = {|
  current: Semver,
  wanted: Semver,
  latest: Semver
|};

export type Update = {|
  name: string,
  current: Semver,
  currentRange: string,
  latest: Semver,
  dev: boolean
|};
export type Updates = Array<Update>;

export type UpdateDetail = {|
  +name: string,
  +current: Semver,
  +currentRange: string,
  +latest: Semver,
  +dev: boolean,
  +repositoryUrl: ?string,
  +compareUrl: ?string,
  +releaseNote: ?string
|};
export type UpdateDetails = Array<UpdateDetail>;

export type PullRequest = {|
  title: string,
  url: string
|};
export type ApplyResult = {|
  pullRequest: PullRequest
|};

export interface PackageManager {
  match(directory: string): Promise<boolean>;
  getLockFileName(): string;
  getUpdates(packageDirectory: string): Promise<Updates>;
  getPackageMeta(packageName: string): Promise<Object>;
  install(packageDirectory: string): Promise<void>;
}

export interface Structure {
  match(directory: string): Promise<boolean>;
  getPackages(directory: string): Promise<Array<string>>;
  install(
    packageDirectory: string,
    rootDirectory: string,
    npmClient: PackageManager
  ): Promise<Set<string>>;
}

export interface Hosting {
  match(repositoryUrl: string): Promise<boolean>;
  shaToTag(token: string, repositoryUrl: string, sha: string): Promise<string>;
  tagExists(
    token: string,
    repositoryUrl: string,
    tag: string
  ): Promise<boolean>;
  tagToReleaseNote(
    token: string,
    repositoryUrl: string,
    tag: string
  ): Promise<?string>;
  getCompareUrl(
    token: string,
    repositoryUrl: string,
    base: string,
    head: string
  ): Promise<string>;
  createPullRequest(
    token: string,
    repositoryUrl: string,
    base: string,
    head: string,
    title: string,
    body: string
  ): Promise<PullRequest>;
  getDefaultBranch(token: string, repositoryUrl: string): Promise<string>;
}

export interface GitImpl {
  add(...paths: Array<string>): Promise<void>;
  checkout(branchName: string): Promise<void>;
  createBranch(branchName: string): Promise<void>;
  commit(message: string): Promise<void>;
  push(token: string, remoteUrl: string, ref: string): Promise<void>;
  getCurrentBranch(): Promise<string>;
  inBranch(branchName: string, fn: () => any): Promise<void>;
}

export interface Reporter {
  reportError(Error): Promise<void>;
  reportUpdates(cwd: string, allUpdates: { [string]: Updates }): Promise<void>;
  reportApplyResult(
    cwd: string,
    applyResult: Array<ApplyResult>
  ): Promise<void>;
}
