// @flow
import type { Structure } from "@hothouse/types";

const debug = require("debug")("hothouse:RepositoryStructureResolver");

export default class RepositoryStructureResolver {
  pluginNames: Array<string> = [
    "@hothouse/monorepo-yarn-workspaces",
    "@hothouse/monorepo-lerna",
    "./SinglePackage"
  ];

  addPlugin(pluginName: string): void {
    this.pluginNames.push(pluginName);
  }

  async detect(directory: string): Promise<Structure> {
    debug(`Detect repository structure in: ${directory}`);
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

    throw new Error(`Cannot detect any repository structure in: ${directory}`);
  }
}
