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
