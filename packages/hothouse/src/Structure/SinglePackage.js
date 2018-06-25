// @flow
import fs from "fs";
import path from "path";

export default class SinglePackage implements Structure {
  async match(directory: string): Promise<boolean> {
    return fs.existsSync(path.join(directory, "package.json"));
  }

  async getPackages(directory: string): Promise<Array<string>> {
    return [directory];
  }

  async install(
    packageDirectory: string,
    rootDirectory: string,
    npmClient: NpmClient
  ): Promise<void> {
    await npmClient.install(packageDirectory);
  }
}
