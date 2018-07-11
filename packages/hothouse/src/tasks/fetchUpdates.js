// @flow
import semver from "semver";
import type { Updates } from "@hothouse/types";
import type { FetchUpdatesAction } from "../actions";
import type { Environment } from "./configure";

const debug = require("debug")("hothouse:fetchUpdates");

export default async (
  action: FetchUpdatesAction,
  env: Environment
): Promise<Updates> => {
  const { packageDir } = action.payload;
  const { packageManager, blackList } = env;

  const updates = await packageManager.getUpdates(packageDir);
  return updates
    .filter(update => {
      const { name, latest, current, currentRange } = update;
      if (semver.satisfies(latest, currentRange)) {
        debug(`${name}@${latest} is covered current semver:${currentRange}`);
        return false;
      }
      if (semver.lt(latest, current)) {
        debug(`${name}@${latest} less than current: ${current}`);
        return false;
      }
      return true;
    })
    .filter(update => {
      if (blackList.match(update.name)) {
        debug(`${update.name} is matched with black list. Ignored`);
        return false;
      }
      return true;
    });
};
