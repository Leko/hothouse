// @flow
import path from "path";

export default (allUpdates: { [string]: Updates }): string => {
  return `chore(package): update dependencies to latest version\n\n${Object.entries(
    allUpdates
  )
    .map(
      ([pkgPath, updates]) =>
        `${path.basename(pkgPath)}:\n${updates
          .map(
            update => `- ${update.name}: ${update.current} -> ${update.latest}`
          )
          .join("\n")}`
    )
    .join("\n\n")}`;
};
