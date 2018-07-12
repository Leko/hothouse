// @flow
import minimatch from "minimatch";

export default class BlackList {
  ignores: Array<string>;

  constructor(ignores: Array<string>) {
    this.ignores = ignores;
  }

  match(packageName: string): boolean {
    return this.ignores.some(name => minimatch(name, packageName));
  }
}
