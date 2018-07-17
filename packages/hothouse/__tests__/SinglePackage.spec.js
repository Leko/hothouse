/* eslint-env jest */
// @flow
import assert from "assert";
import path from "path";
import Npm from "@hothouse/client-npm";
import Yarn from "@hothouse/client-yarn";
import SinglePackage from "../src/SinglePackage";

test("SinglePackage#getChanges should return [package.json] when lockfile not exists", async () => {
  const pkg = new SinglePackage();
  const expected = new Set(["package.json"]);
  const actual = await pkg.getChanges(
    path.join(__dirname, "fixtures", "has-not-package-lock-json"),
    new Npm()
  );
  assert.deepStrictEqual(actual, expected);
});
test("SinglePackage#getChanges should return [package.json, package-lock.json] when lockfile exists with Npm", async () => {
  const pkg = new SinglePackage();
  const expected = new Set(["package.json", "package-lock.json"]);
  const actual = await pkg.getChanges(
    path.join(__dirname, "fixtures", "has-package-lock-json"),
    new Npm()
  );
  assert.deepStrictEqual(actual, expected);
});
test("SinglePackage#getChanges should return [package.json, yarn.lock] when lockfile exists with Yarn", async () => {
  const pkg = new SinglePackage();
  const expected = new Set(["package.json", "yarn.lock"]);
  const actual = await pkg.getChanges(
    path.join(__dirname, "fixtures", "has-yarn-lock"),
    new Yarn()
  );
  assert.deepStrictEqual(actual, expected);
});
