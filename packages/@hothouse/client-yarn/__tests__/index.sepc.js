/* eslint-env jest */
// @flow
import assert from "assert";
import path from "path";
import Yarn from "../src/index";

test("Yarn#match should returns true if directory have yarn.lock", async () => {
  const yarn = new Yarn();
  assert.ok(await yarn.match(path.join(__dirname, "fixtures", "is-yarn")));
});
test("Yarn#match should returns true if directory have lerna.json and npmClient=yarn", async () => {
  const yarn = new Yarn();
  assert.ok(
    await yarn.match(path.join(__dirname, "fixtures", "is-lerna-yarn"))
  );
});
test("Yarn#match should returns false if directory have lerna.json and npmClient is not yarn", async () => {
  const yarn = new Yarn();
  assert.ok(
    !(await yarn.match(path.join(__dirname, "fixtures", "is-lerna-npm")))
  );
});
test("Yarn#match should returns true if directory have package.json and workspaces field", async () => {
  const yarn = new Yarn();
  assert.ok(
    await yarn.match(path.join(__dirname, "fixtures", "is-yarn-workspaces"))
  );
});
test("Yarn#match should returns false if directory not have yarn.lock", async () => {
  const yarn = new Yarn();
  assert.ok(!(await yarn.match(path.join(__dirname, "fixtures", "not-yarn"))));
});

test("Yarn#getLockFileName should returns yarn.lock", async () => {
  const npm = new Yarn();
  assert.ok(npm.getLockFileName(), "yarn.lock");
});
