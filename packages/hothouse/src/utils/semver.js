// @flow
import semver from "semver";

export const replace = (
  fromVersionRange: string,
  toVersion: string
): string => {
  const UPDATE_LIMITS = 200;
  const prefixRegEx = /^(\^|~|>=|>|<|<=)?\s*(.*)$/;
  if (!prefixRegEx.test(fromVersionRange)) {
    throw new Error(`Unsupported semver format: ${fromVersionRange}`);
  }
  // $FlowFixMe(already-tested)
  const [, prefix, fromVersion] = fromVersionRange.match(prefixRegEx);
  let updated = fromVersion;
  for (let i = 0; i < UPDATE_LIMITS; i++) {
    const diff = semver.diff(updated, toVersion);
    if (!diff) {
      break;
    }
    updated = semver.inc(updated, diff);
  }
  if (semver.diff(updated, toVersion)) {
    throw new Error(
      `Too many diffs to update to ${toVersion} from ${fromVersionRange}`
    );
  }
  return (prefix || "") + updated;
};
