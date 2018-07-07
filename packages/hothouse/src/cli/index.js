#!/usr/bin/env node
// @flow
import chalk from "chalk";
import { bugs } from "../../package.json";
import cliOptions from "./options";
import runner from "./runner";
import gitImpl from "../git";
import { InternalError } from "../errors";

runner({
  cliOptions: cliOptions.argv,
  cwd: process.cwd(),
  gitImpl
}).catch(e => {
  console.error(chalk.red(e.stack)); // eslint-disable-line no-console
  if (e instanceof InternalError) {
    // eslint-disable-next-line no-console
    console.error(
      `\nIt's internal bug.\nPlease report issue from here: ${bugs.url}`
    );
  }
  process.exit(1);
});
