/* eslint-env jest */
// @flow
import assert from "assert";
import options from "../../src/cli/options";

const baseOptions = ["-t", "xxx"];

test("options can parse --token as string", () => {
  const token = "xxx";
  assert.equal(options.parse(["--token", token]).token, token);
});
test("options throws when --token is missing", () => {
  assert.throws(() =>
    options
      .exitProcess(false)
      .showHelpOnFail(false)
      .parse([])
  );
});

test("options returns perPackage=true when --per-package is missing", () => {
  assert.ok(options.parse([...baseOptions]).perPackage);
});
test("options returns perPackage=false when --no-per-package", () => {
  assert.ok(!options.parse([...baseOptions, "--no-per-package"]).perPackage);
});

test("options returns bail=true when --bail is missing", () => {
  assert.ok(options.parse([...baseOptions]).bail);
});
test("options can parse --bail as boolean", () => {
  assert.equal(options.parse([...baseOptions, "--bail", "false"]).bail, false);
});

test("options can parse --package-manager as string", () => {
  const packageManager = "hoge";
  assert.equal(
    options.parse([...baseOptions, "--package-manager", packageManager])
      .packageManager,
    packageManager
  );
});

test("options can parse --repository-structure as string", () => {
  const repositoryStructure = "hoge";
  assert.equal(
    options.parse([
      ...baseOptions,
      "--repository-structure",
      repositoryStructure
    ]).repositoryStructure,
    repositoryStructure
  );
});

test("options can parse --ignore as CSV", () => {
  assert.deepStrictEqual(
    options.parse([...baseOptions, "--ignore", "hoge,foo,bar"]).ignore,
    ["hoge", "foo", "bar"]
  );
});

test("options returns dryRun=false when --dry-run is missing", () => {
  assert.ok(!options.parse([...baseOptions]).dryRun);
});
test("options can parse --dry-run as boolean", () => {
  assert.ok(options.parse([...baseOptions, "--dry-run"]).dryRun);
});
