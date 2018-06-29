/* eslint-env jest */
// @flow
import assert from "assert";
import path from "path";
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
