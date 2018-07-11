// @flow
import type { UpdateDetails } from "@hothouse/types";
import type { Config } from "./worker";
import type UpdateChunk from "./UpdateChunk";

export type ConfigureAction = {|
  type: "configure",
  payload: Config
|};
export type ApplyUpdatesAction = {|
  type: "applyUpdates",
  payload: {
    updateChunk: UpdateChunk,
    updateDetails: UpdateDetails,
    source: string,
    base: string
  }
|};
export type FetchReleasesAction = {|
  type: "fetchReleases",
  payload: {
    updateChunk: UpdateChunk
  }
|};
export type FetchUpdatesAction = {|
  type: "fetchUpdates",
  payload: {
    packageDir: string
  }
|};

export type Action =
  | ConfigureAction
  | ApplyUpdatesAction
  | FetchReleasesAction
  | FetchUpdatesAction;

export const configure = (config: Config): ConfigureAction => ({
  type: "configure",
  payload: config
});

export const applyUpdates = ({
  updateChunk,
  updateDetails,
  source,
  base
}: {
  updateChunk: UpdateChunk,
  updateDetails: UpdateDetails,
  source: string,
  base: string
}): ApplyUpdatesAction => ({
  type: "applyUpdates",
  payload: {
    updateChunk,
    updateDetails,
    source,
    base
  }
});

export const fetchReleases = (
  updateChunk: UpdateChunk
): FetchReleasesAction => ({
  type: "fetchReleases",
  payload: {
    updateChunk
  }
});

export const fetchUpdates = (packageDir: string): FetchUpdatesAction => ({
  type: "fetchUpdates",
  payload: {
    packageDir
  }
});
