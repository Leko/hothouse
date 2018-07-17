/* eslint-env jest */
// @flow
import assert from "assert";
import path from "path";
import Npm from "@hothouse/client-npm";
import Yarn from "@hothouse/client-yarn";
import Lerna from "../src/index";

test("Lerna#match should returns true if directory have lerna.json", async () => {
  const lerna = new Lerna();
  assert.ok(await lerna.match(path.join(__dirname, "fixtures", "is-lerna")));
});
test("Lerna#match should returns true if directory not have lerna.json", async () => {
  const lerna = new Lerna();
  assert.ok(
    !(await lerna.match(path.join(__dirname, "fixtures", "not-lerna")))
  );
});

test("Lerna#getChanges should return [prefix/package.json] when lockfile not exists", async () => {
  const lerna = new Lerna();
  const prefix = path.join("packages", "has-not-package-lock-json");
  const expected = new Set([path.join(prefix, "package.json")]);
  const actual = await lerna.getChanges(
    path.join(
      __dirname,
      "fixtures",
      "lockfile-npm",
      "packages",
      "has-not-package-lock-json"
    ),
    path.join(__dirname, "fixtures", "lockfile-npm"),
    new Npm()
  );
  assert.deepStrictEqual(actual, expected);
});
test("Lerna#getChanges should return [prefix/package.json, prefix/package-lock.json] when npmClient=npm lockfile exists", async () => {
  const lerna = new Lerna();
  const prefix = path.join("packages", "has-package-lock-json");
  const expected = new Set([
    path.join(prefix, "package.json"),
    path.join(prefix, "package-lock.json")
  ]);
  const actual = await lerna.getChanges(
    path.join(
      __dirname,
      "fixtures",
      "lockfile-npm",
      "packages",
      "has-package-lock-json"
    ),
    path.join(__dirname, "fixtures", "lockfile-npm"),
    new Npm()
  );
  assert.deepStrictEqual(actual, expected);
});
test("Lerna#getChanges should return [prefix/package.json] when npmClient=yarn lockfile not exists", async () => {
  const lerna = new Lerna();
  const prefix = path.join("packages", "has-not-yarn-lock");
  const expected = new Set([path.join(prefix, "package.json")]);
  const actual = await lerna.getChanges(
    path.join(
      __dirname,
      "fixtures",
      "lockfile-yarn",
      "packages",
      "has-not-yarn-lock"
    ),
    path.join(__dirname, "fixtures", "lockfile-yarn"),
    new Yarn()
  );
  assert.deepStrictEqual(actual, expected);
});
test("Lerna#getChanges should return [prefix/package.json, prefix/yarn.lock] when npmClient=yarn lockfile exists", async () => {
  const lerna = new Lerna();
  const prefix = path.join("packages", "has-yarn-lock");
  const expected = new Set([
    path.join(prefix, "package.json"),
    path.join(prefix, "yarn.lock")
  ]);
  const actual = await lerna.getChanges(
    path.join(
      __dirname,
      "fixtures",
      "lockfile-yarn",
      "packages",
      "has-yarn-lock"
    ),
    path.join(__dirname, "fixtures", "lockfile-yarn"),
    new Yarn()
  );
  assert.deepStrictEqual(actual, expected);
});
