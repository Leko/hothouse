// @flow
import type {
  Update,
  UpdateDetail,
  UpdateDetails,
  PackageManager
} from "@hothouse/types";
import type { FetchReleasesAction } from "../actions";
import type { Environment } from "./configure";
import Package from "../Package";
import { detect } from "../Hosting";
import md2html from "../utils/md2html";

const debug = require("debug")("hothouse:fetchReleases");

export default async (
  action: FetchReleasesAction,
  env: Environment
): Promise<UpdateDetails> => {
  const { updateChunk } = action.payload;

  const updateDetails: UpdateDetails = [];
  for (let pkgPath in updateChunk.allUpdates) {
    for (let update of updateChunk.allUpdates[pkgPath]) {
      const updateDetail = await getUpdateDetail(update, env);
      updateDetails.push(updateDetail);
    }
  }
  return updateDetails;
};

export const getUpdateDetail = async (
  update: Update,
  env: Environment
): Promise<UpdateDetail> => {
  const { packageManager, token } = env;
  const { name, current, latest } = update;

  const pkgAnnotation = `${update.name}@${update.latest}`;
  const meta = await packageManager.getPackageMeta(pkgAnnotation);
  const pkg = new Package(meta);
  const repositoryUrl = pkg.getRepositoryHttpsUrl();

  const currentTag = await getTag(packageManager, token, name, current);
  const latestTag = await getTag(packageManager, token, name, latest);
  debug(pkgAnnotation, { currentTag, latestTag });

  const compareUrl =
    currentTag && latestTag
      ? await getCompareUrl(token, meta, currentTag, latestTag)
      : null;
  const releaseNote = latestTag
    ? await getReleaseNote(token, meta, latestTag)
    : null;

  return {
    ...update,
    repositoryUrl,
    compareUrl,
    releaseNote: releaseNote ? md2html(releaseNote) : null
  };
};

export const getTag = async (
  packageManager: PackageManager,
  token: string,
  packageName: string,
  version: string
): Promise<?string> => {
  const pkgAnnotation = `${packageName}@${version}`;
  debug(`Try to fetch tag of ${pkgAnnotation}`);

  try {
    const meta = await packageManager.getPackageMeta(pkgAnnotation);
    const pkg = new Package(meta);
    const hosting = await detect(pkg);

    const commonTagNames = [`v${version}`, version];
    for (let tag of commonTagNames) {
      debug(`Try to check tag exists: ${tag} in ${pkgAnnotation}`);
      if (await hosting.tagExists(token, meta.repository.url, tag)) {
        return tag;
      }
    }
    if (!meta.gitHead) {
      debug(
        `gitHead is not specified so cannot resolve tag name: ${pkgAnnotation}`
      );
      return null;
    }
    debug(`Try to resolve tag by gitHead: ${meta.gitHead}`);
    return await hosting.shaToTag(token, meta.repository.url, meta.gitHead);
  } catch (error) {
    debug(
      `An error occured during fetch compare url in ${pkgAnnotation}:`,
      error.stack
    );
    return null;
  }
};

export const getCompareUrl = async (
  token: string,
  meta: Object,
  currentTag: ?string,
  latestTag: ?string
): Promise<?string> => {
  if (!currentTag || !latestTag) {
    return null;
  }

  debug(`Try to fetch compare url ${meta.name}@${meta.version}`);
  try {
    const pkg = new Package(meta);
    const hosting = await detect(pkg);
    return await hosting.getCompareUrl(
      token,
      meta.repository.url,
      currentTag,
      latestTag
    );
  } catch (error) {
    debug(
      `An error occured during fetch compare url in ${meta.name}@${
        meta.version
      }:`,
      error.stack
    );
    return null;
  }
};

export const getReleaseNote = async (
  token: string,
  meta: Object,
  latestTag: ?string
): Promise<?string> => {
  if (!latestTag) {
    return null;
  }

  debug(`Try to fetch release note about ${meta.name} with tag ${latestTag}`);
  try {
    const pkg = new Package(meta);
    const hosting = await detect(pkg);
    const releaseNote = await hosting.tagToReleaseNote(
      token,
      meta.repository.url,
      latestTag
    );
    return releaseNote;
  } catch (error) {
    debug(
      `An error occured during fetch release note in ${meta.name}@${
        meta.version
      }:`,
      error.stack
    );
    return null;
  }
};
