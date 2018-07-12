/* eslint-env jest */
// @flow
import assert from "assert";
import path from "path";
import semver from "semver";
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
  const yarn = new Yarn();
  assert.ok(yarn.getLockFileName(), "yarn.lock");
});

test("Yarn#getUpdates can retrieve updates", async () => {
  const yarn = new Yarn();
  const dir = path.join(__dirname, "fixtures", "update-available");
  const updates = await yarn.getUpdates(dir);
  updates.forEach(({ name, current, currentRange, latest }) => {
    assert.ok(semver.satisfies(current, currentRange), `${name}:currentRange`);
    assert.ok(semver.valid(current), `${name}:current`);
    assert.ok(semver.valid(latest), `${name}:latest`);
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
