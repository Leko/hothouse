// @flow
import path from "path";
import type { Updates } from "@hothouse/types";

export default (allUpdates: { [string]: Updates }): string => {
  return `chore(package): update dependencies to latest version\n\n${Object.entries(
    allUpdates
  )
    .map(
      // $FlowFixMe(entries-returns-Updates)
      ([pkgPath, updates]: [string, Updates]) =>
        `${path.basename(pkgPath)}:\n${updates
          .map(
            update => `- ${update.name}: ${update.current} -> ${update.latest}`
          )
          .join("\n")}`
    )
    .join("\n\n")}`;
};
