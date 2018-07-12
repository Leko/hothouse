// @flow
import type { Hosting, PackageManager, Structure } from "@hothouse/types";
import type { ConfigureAction } from "../actions";
import PackageManagerResolver from "../PackageManagerResolver";
import RepositoryStructureResolver from "../RepositoryStructureResolver";
import { detect } from "../Hosting";
import BlackList from "../BlackList";
import Package from "../Package";

export type Environment = {|
  rootDirectory: string,
  token: string,
  token: string,
  dryRun: boolean,
  pkg: Package,
  packageManager: PackageManager,
  repositoryStructure: Structure,
  hosting: Hosting,
  blackList: BlackList
|};

export default async (action: ConfigureAction): Promise<Environment> => {
  const {
    rootDirectory,
    token,
    dryRun,
    packageManager,
    repositoryStructure,
    ignore
  } = action.payload;
  const packageManagerResolver = new PackageManagerResolver();
  const structureResolver = new RepositoryStructureResolver();
  const pkg = Package.createFromDirectory(rootDirectory);

  if (packageManager) {
    packageManagerResolver.addPlugin(packageManager);
  }
  if (repositoryStructure) {
    structureResolver.addPlugin(repositoryStructure);
  }

  return {
    rootDirectory,
    token,
    dryRun,
    packageManager: await packageManagerResolver.detect(rootDirectory),
    repositoryStructure: await structureResolver.detect(rootDirectory),
    hosting: await detect(pkg),
    pkg,
    blackList: new BlackList(ignore)
  };
};
