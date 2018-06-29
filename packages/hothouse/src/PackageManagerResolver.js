// @flow
import type { PackageManager } from "@hothouse/types";

const debug = require("debug")("hothouse:PackageManagerResolver");

export default class PackageManagerResolver {
  plugins: Array<PackageManager>;

  constructor(pluginNames: Array<string>) {
    this.plugins = pluginNames.map(pluginName => {
      // $FlowFixMe(allow-dynamic-require)
      const Plugin = require(pluginName);
      return new Plugin();
    });
  }

  async detect(directory: string): Promise<PackageManager> {
    debug(`Detect package manager in: ${directory}`);
    for (let plugin of this.plugins) {
      const matched = await plugin.match(directory);
      debug(`${plugin.constructor.name}: matched=${String(matched)}`);
      if (matched) {
        return plugin;
      }
    }

    throw new Error(`Cannot detect any package manager in: ${directory}`);
  }
}