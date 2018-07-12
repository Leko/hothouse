#!/usr/bin/env node
// @flow
import cliOptions from "./options";
import runner from "./runner";
import gitImpl from "../git";
import reporter from "../reporters";

runner({
  cliOptions: cliOptions.parse(),
  cwd: process.cwd(),
  gitImpl,
  reporter
}).catch(() => {
  process.exit(1);
});
