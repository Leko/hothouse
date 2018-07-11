// @flow
import type { ApplyUpdatesAction, ApplyResult } from "../actions";
import type { Environment } from "./configure";
import {
  createPullRequestTitle,
  createPullRequestMessage
} from "../pullRequest";

const debug = require("debug")("hothouse:applyUpdates");

export default async (
  action: ApplyUpdatesAction,
  env: Environment
): Promise<ApplyResult> => {
  const { token, hosting, pkg, dryRun } = env;
  const { updateDetails, source, base } = action.payload;
  const repositoryUrl = pkg.getRepositoryHttpsUrl();

  const title = createPullRequestTitle(updateDetails);
  const body = createPullRequestMessage(updateDetails);

  debug(`${dryRun ? "(dryRun): " : ""}Try to create PR:`, {
    repositoryUrl,
    base,
    source,
    title,
    body
  });
  if (!dryRun) {
    const pullRequest = hosting.createPullRequest(
      token,
      repositoryUrl,
      base,
      source,
      title,
      body
    );
    return { pullRequest };
  }
};
