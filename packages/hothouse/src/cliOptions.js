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
  .option("token", {
    group: "Pull request",
    alias: "t",
    required: true,
    type: "string",
    description: "Access token of GitHub"
  })
  .option("per-package", {
    group: "Pull request",
    alias: "p",
    type: "boolean",
    description:
      "Send pull requests per package\nIf you want to send unified pull requests, please specify --no-per-package",
    default: true
  })
  .option("package-manager", {
    group: "Plugin",
    type: "string",
    description:
      "Plugin names for package manager\nIf not specified, detect your project automatically"
  })
  .option("repository-structure", {
    group: "Plugin",
    type: "string",
    description:
      "Plugin names for repository structure\nIf not specified, detect your project automatically"
  })
  .option("ignore", {
    group: "Filter packages",
    type: "string",
    description: "Comma separated package names to ignore updates",
    coerce: (ignore: string) =>
      ignore
        .split(",")
        .map(pkg => pkg.trim())
        .filter(pkg => !!pkg),
    default: ""
  })
  .option("dry-run", {
    group: "Debug",
    type: "boolean",
    description:
      "Don't cause any side effects (e.g. commit, push, pull request)",
    default: false
  });