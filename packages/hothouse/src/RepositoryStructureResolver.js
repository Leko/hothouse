// @flow
import type { Structure } from "@hothouse/types";

const debug = require("debug")("hothouse:RepositoryStructureResolver");

export default class RepositoryStructureResolver {
  plugins: Array<Structure>;

  constructor(pluginNames: Array<string>) {
    this.plugins = pluginNames.map(pluginName => {
      // $FlowFixMe(allow-dynamic-require)
      const Plugin = require(pluginName);
      return new Plugin();
    });
  }

  async detect(directory: string): Promise<Structure> {
    debug(`Detect repository structure in: ${directory}`);
    for (let plugin of this.plugins) {
      const matched = await plugin.match(directory);
      debug(`${plugin.constructor.name}: matched=${String(matched)}`);
      if (matched) {
        return plugin;
      }
    }

    throw new Error(`Cannot detect any repository structure in: ${directory}`);
  }
}
