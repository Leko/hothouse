// @flow
import type { Action } from "./actions";
import applyUpdates from "./tasks/applyUpdates";
import fetchReleases from "./tasks/fetchReleases";
import fetchUpdates from "./tasks/fetchUpdates";
import configure, { type Environment } from "./tasks/configure";

export type Config = {|
  rootDirectory: string,
  token: string,
  dryRun: boolean,
  packageManager: ?string,
  repositoryStructure: ?string,
  ignore: Array<string>
|};

let env: Environment;

// threads.js expected module.exports not `export default`
module.exports = async (action: Action) => {
  switch (action.type) {
    case "configure":
      env = await configure(action);
      return;
    case "applyUpdates":
      return applyUpdates(action, env);
    case "fetchReleases":
      return fetchReleases(action, env);
    case "fetchUpdates":
      return fetchUpdates(action, env);
    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
};
