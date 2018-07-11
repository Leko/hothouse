// @flow
import type { PackageManager } from "@hothouse/types";

const debug = require("debug")("hothouse:PackageManagerResolver");

export default class PackageManagerResolver {
  pluginNames: Array<string> = [
    "@hothouse/client-yarn",
    "@hothouse/client-npm"
  ];

  addPlugin(pluginName: string): void {
    this.pluginNames.push(pluginName);
  }

  async detect(directory: string): Promise<PackageManager> {
    debug(`Detect package manager in: ${directory}`);
    const plugins = this.pluginNames.map(pluginName => {
      // $FlowFixMe(allow-dynamic-require)
      const Plugin = require(pluginName);
      return new Plugin();
    });
    for (let plugin of plugins) {
      const matched = await plugin.match(directory);
      debug(`${plugin.constructor.name}: matched=${String(matched)}`);
      if (matched) {
        return plugin;
      }
    }

    throw new Error(`Cannot detect any package manager in: ${directory}`);
  }
}
