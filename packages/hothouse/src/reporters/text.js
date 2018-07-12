// @flow
import path from "path";
import semver from "semver";
import chalk from "chalk";
import { emojify as e } from "node-emoji";
import flatten from "lodash/flatten";
import type { Reporter, Updates, ApplyResult } from "@hothouse/types";
import { bugs } from "../../package.json";

const diffToColors = {
  major: chalk.red,
  premajor: chalk.red,
  minor: chalk.yellow,
  preminor: chalk.yellow,
  patch: chalk.cyan,
  prepatch: chalk.cyan,
  prerelease: chalk.green
};

const text = (stream: stream$Writable): Reporter => ({
  async reportError(error: Error): Promise<void> {
    stream.write(chalk.red(error.stack) + "\n");
    stream.write(`Please report issue from here: ${bugs.url}\n`);
  },

  async reportUpdates(
    cwd: string,
    allUpdates: { [string]: Updates }
  ): Promise<void> {
    const updateGroups = Object.values(allUpdates).filter(
      // $FlowFixMe(entries-no-returns-mixed)
      updates => updates.length > 0
    );
    const updates = flatten(updateGroups).length;

    if (updates === 0) {
      stream.write(e("All packages are already up-to-date :sparkles:\n"));
      return;
    }
    stream.write(
      `${updateGroups.length} packages have ${updates} updates:\n\n`
    );

    // $FlowFixMe(entries-no-returns-mixed)
    Object.entries(allUpdates).forEach(([pkg, updates]: [string, Updates]) => {
      if (updates.length === 0) {
        return;
      }

      const dir = path.relative(cwd, pkg);
      stream.write(`  ${dir}\n\n`);
      updates.forEach(({ name, latest, current, currentRange }) => {
        const decorate = diffToColors[semver.diff(current, latest)];
        stream.write(`    - ${name}: ${current} -> ${decorate(latest)}\n`);
      });
      stream.write("\n");
    });
  },

  async reportApplyResult(
    cwd: string,
    applyResults: Array<ApplyResult>
  ): Promise<void> {
    const numOfPR = applyResults.length;
    stream.write(`${numOfPR} pull requests have been created:\n\n`);
    applyResults.forEach(({ pullRequest }) => {
      stream.write(`  ${pullRequest.title}\n`);
      stream.write(`  ${pullRequest.url}\n\n`);
    });
  }
});

export { text };
export default text(process.stdout);
