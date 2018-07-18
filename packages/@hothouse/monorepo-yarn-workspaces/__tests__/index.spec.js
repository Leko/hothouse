/* eslint-env jest */
// @flow
import assert from "assert";
import path from "path";
import YarnWorkspaces from "../src/index";

test("YarnWorkspaces#match should returns true if directory have package.json and workspaces field", async () => {
  const yarnWorkspaces = new YarnWorkspaces();
  assert.ok(
    await yarnWorkspaces.match(
      path.join(__dirname, "fixtures", "is-yarn-workspaces")
    )
  );
});
test("YarnWorkspaces#match should returns false if directory not have package.json", async () => {
  const yarnWorkspaces = new YarnWorkspaces();
  assert.ok(
    !(await yarnWorkspaces.match(
      path.join(__dirname, "fixtures", "not-yarn-workspaces")
    ))
  );
});
test("YarnWorkspaces#match must returns false if directory not have package.json", async () => {
  const yarnWorkspaces = new YarnWorkspaces();
  assert.ok(
    !(await yarnWorkspaces.match(
      path.join(__dirname, "fixtures", "not-exists-path")
    ))
  );
});

test("YarnWorkspaces#getPackages should return [package.json, yarn.lock] when lockfile exists", async () => {
  const lerna = new YarnWorkspaces();
  const prefix = path.join(
    __dirname,
    "fixtures",
    "has-yarn-workspaces-with-lockfile"
  );
  const expected = [path.join(prefix, "packages", "child-a")];
  const actual = await lerna.getPackages(prefix);
  assert.deepStrictEqual(actual, expected);
});

test("YarnWorkspaces#getChanges should return [package.json] when lockfile not exists", async () => {
  const lerna = new YarnWorkspaces();
  const expected = new Set(["package.json"]);
  const actual = await lerna.getChanges(
    path.join(__dirname, "fixtures", "is-yarn-workspaces")
  );
  assert.deepStrictEqual(actual, expected);
});
test("YarnWorkspaces#getChanges should return [package.json, yarn.lock] when lockfile exists", async () => {
  const lerna = new YarnWorkspaces();
  const expected = new Set(["package.json", "yarn.lock"]);
  const actual = await lerna.getChanges(
    path.join(__dirname, "fixtures", "has-yarn-workspaces-with-lockfile")
  );
  assert.deepStrictEqual(actual, expected);
});
