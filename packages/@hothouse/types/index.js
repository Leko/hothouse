// @flow

export type Semver = string;
export type Outdated = {|
  current: Semver,
  wanted: Semver,
  latest: Semver,
  location: string
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

export interface PackageManager {
  match(directory: string): Promise<boolean>;
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
  ): Promise<void>;
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
  ): Promise<string>;
  getDefaultBranch(token: string, repositoryUrl: string): Promise<string>;
}
