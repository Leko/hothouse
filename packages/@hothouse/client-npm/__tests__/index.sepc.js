/* eslint-env jest */
// @flow
import assert from "assert";
import path from "path";
import Npm from "../src/index";

test("Npm#match should returns true if directory have package.json", async () => {
  const npm = new Npm();
  assert.ok(await npm.match(path.join(__dirname, "fixtures", "is-npm")));
});
test("Npm#match should returns false if directory not have package.json", async () => {
  const npm = new Npm();
  assert.ok(!(await npm.match(path.join(__dirname, "fixtures", "not-npm"))));
});
