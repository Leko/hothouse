/* eslint-env jest */
// @flow
import assert from "assert";
import path from "path";
import semver from "semver";
import Yarn from "../src/index";

test("Yarn#match should returns true if directory have yarn.lock", async () => {
  const yarn = new Yarn();
  assert(await yarn.match(path.join(__dirname, "fixtures", "is-yarn")));
});
test("Yarn#match should returns true if directory have lerna.json and npmClient=yarn", async () => {
  const yarn = new Yarn();
  assert(await yarn.match(path.join(__dirname, "fixtures", "is-lerna-yarn")));
});
test("Yarn#match should returns false if directory have lerna.json and npmClient is not yarn", async () => {
  const yarn = new Yarn();
  assert(!(await yarn.match(path.join(__dirname, "fixtures", "is-lerna-npm"))));
});
test("Yarn#match should returns true if directory have package.json and workspaces field", async () => {
  const yarn = new Yarn();
  assert(
    await yarn.match(path.join(__dirname, "fixtures", "is-yarn-workspaces"))
  );
});
test("Yarn#match should returns false if directory not have yarn.lock", async () => {
  const yarn = new Yarn();
  assert(!(await yarn.match(path.join(__dirname, "fixtures", "not-yarn"))));
});

test("Yarn#getLockFileName should returns yarn.lock", async () => {
  const yarn = new Yarn();
  assert(yarn.getLockFileName(), "yarn.lock");
});

test("Yarn#toUpdate can retries currentRange from dependencies", async () => {
  const yarn = new Yarn();
  const pkg = {
    dependencies: {
      "pkg-a": "^1.2.0"
    }
  };
  const payload = {
    Package: "pkg-a",
    Current: "1.2.3",
    Latest: "2.0.0",
    "Package Type": "dependencies"
  };
  const expected = {
    name: "pkg-a",
    current: "1.2.3",
    currentRange: "^1.2.0",
    latest: "2.0.0",
    dev: false
  };
  assert.deepStrictEqual(yarn.toUpdate(payload, pkg), expected);
});
test("Yarn#toUpdate can retries currentRange from devDependencies", async () => {
  const yarn = new Yarn();
  const pkg = {
    devDependencies: {
      "pkg-a": "^1.2.0"
    }
  };
  const payload = {
    Package: "pkg-a",
    Current: "1.2.3",
    Latest: "2.0.0",
    "Package Type": "devDependencies"
  };
  const expected = {
    name: "pkg-a",
    current: "1.2.3",
    currentRange: "^1.2.0",
    latest: "2.0.0",
    dev: true
  };
  assert.deepStrictEqual(yarn.toUpdate(payload, pkg), expected);
});

test("Yarn#filterRow should return true when Latest is not exotic", () => {
  const yarn = new Yarn();
  const actual = yarn.filterRow(
    {
      Package: "some-pkg",
      Current: "1.2.3",
      Latest: "1.3.0",
      "Package Type": "devDependencies"
    },
    { name: "pkg-a" }
  );

  assert(actual);
});
test("Yarn#filterRow should return false when Latest is exotic", () => {
  const yarn = new Yarn();
  const actual = yarn.filterRow(
    {
      Package: "some-pkg",
      Current: "1.2.3",
      Latest: "exotic",
      "Package Type": "devDependencies"
    },
    { name: "pkg-a" }
  );

  assert(!actual);
});
test("Yarn#filterRow should return true when it included in this package in Yarn workspaces", () => {
  const yarn = new Yarn();
  const actual = yarn.filterRow(
    {
      Package: "some-pkg",
      Current: "1.2.3",
      Latest: "1.3.0",
      "Package Type": "devDependencies",
      Workspace: "pkg-a"
    },
    { name: "pkg-a" }
  );

  assert(actual);
});
test("Yarn#filterRow should return false when outside dependency in Yarn workspaces", () => {
  const yarn = new Yarn();
  const actual = yarn.filterRow(
    {
      Package: "some-pkg",
      Current: "1.2.3",
      Latest: "1.3.0",
      "Package Type": "devDependencies",
      Workspace: "pkg-b"
    },
    { name: "pkg-a" }
  );

  assert(!actual);
});

test("Yarn#getUpdates can retrieve updates", async () => {
  const yarn = new Yarn();
  const dir = path.join(__dirname, "fixtures", "update-available");
  const updates = await yarn.getUpdates(dir);
  updates.forEach(({ name, current, currentRange, latest }) => {
    assert(semver.satisfies(current, currentRange), `${name}:currentRange`);
    assert(semver.valid(current), `${name}:current`);
    assert(semver.valid(latest), `${name}:latest`);
  });
  const filetered = updates.map(({ name, current, currentRange, dev }) => ({
    name,
    currentRange,
    dev
  }));
  assert.deepStrictEqual(filetered, [
    { name: "babel", currentRange: "~6.0.0", dev: false },
    { name: "babel-cli", currentRange: "~6.0.0", dev: true }
  ]);
});
