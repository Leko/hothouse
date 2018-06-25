// @flow
import path from "path";
import glob from "glob";

export default class YarnWorkspaces implements Structure {
  async match(directory: string): Promise<boolean> {
    // $FlowFixMe(dynamic-require)
    const pkg = require(path.join(directory, "package.json"));
    return !!pkg.workspaces;
  }

  async getPackages(directory: string): Promise<Array<string>> {
    // $FlowFixMe(dynamic-require)
    const settings = require(path.join(directory, "lerna.json"));
    return settings.packages.reduce(
      (acc, pkg) => acc.concat(glob.sync(pkg, { absolute: true })),
      []
    );
  }
  async install(
    packageDirectory: string,
    rootDirectory: string,
    npmClient: NpmClient
  ): Promise<void> {
    await npmClient.install(rootDirectory);
  }
}
