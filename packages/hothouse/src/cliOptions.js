// @flow
import yargs from "yargs";
import { version } from "../package.json";

export type CLIOptions = {
  ignore: Array<string>,
  perPackage: boolean,
  token: string,
  dryRun: boolean
};

export default yargs
  .version(version)
  .option("ignore", {
    type: "string",
    description: "Comma separated package names to ignore updates",
    coerce: (ignore: string) =>
      ignore
        .split(",")
        .map(pkg => pkg.trim())
        .filter(pkg => !!pkg),
    default: ""
  })
  .option("per-package", {
    alias: "p",
    type: "boolean",
    description: "Send pull requests per package",
    default: true
  })
  .option("token", {
    alias: "t",
    required: true,
    type: "string",
    description: "Access token of GitHub"
  })
  .option("dry-run", {
    type: "boolean",
    description:
      "Don't cause any side effects. (e.g. commit, push, pull request)",
    default: false
  });
