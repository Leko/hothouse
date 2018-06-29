/* eslint-env jest */
// @flow
import assert from "assert";
import Package from "../src/Package";

test("Package can instantiate with valid package path", () => {
  const pkg = new Package("../package.json");
  assert.equal(pkg.constructor, Package);
});
test("Package cannot instantiate with invalid package path", () => {
  assert.throws(() => new Package("./not-exists-path.json"));
});
