// @flow
import path from "path";
import type { Updates } from "@hothouse/types";
import type UpdateChunk from "./UpdateChunk";

export default (updateChunk: UpdateChunk): string => {
  return `chore(package): update dependencies to latest version\n\n${Object.entries(
    updateChunk.allUpdates
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
