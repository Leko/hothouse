// @flow
import path from "path";
import type { Updates } from "@hothouse/types";

export const createPullRequestTitle = (...packages: Array<string>): string =>
  `Update ${packages.join(", ")} to latest version`;

export const createPullRequestMessage = (
  allUpdates: { [string]: Updates },
  updateDetails: {
    [string]: {
      currentTag: string,
      latestTag: string,
      compareUrl: string,
      releaseNote: ?string
    }
  }
): string =>
  `${Object.entries(allUpdates)
    .map(
      // $FlowFixMe(entries-returns-Updates)
      ([pkgPath, updates]: [string, Updates]) =>
        `## ${path.basename(pkgPath)}\n\n${updates
          .map(
            update =>
              `* ${update.name} ${update.current} -> ${
                update.latest
              } (compare: ${updateDetails[update.name].compareUrl})${
                updateDetails[update.name].releaseNote
                  ? `\n  ${updateDetails[update.name].releaseNote}`
                  : ""
              }`
          )
          .join("\n")}`
    )
    .join("\n\n---\n\n")}`;
