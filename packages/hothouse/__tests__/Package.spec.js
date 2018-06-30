/* eslint-env jest */
// @flow
import assert from "assert";
import Package, { replaceSemver } from "../src/Package";

test("Package can instantiate with valid package path", () => {
  const pkg = new Package("../package.json");
  assert.equal(pkg.constructor, Package);
});
test("Package cannot instantiate with invalid package path", () => {
  assert.throws(() => new Package("./not-exists-path.json"));
});

test("replaceSemver can replace exact semver", () => {
  assert.equal(replaceSemver("1.2.3", "4.5.6"), "4.5.6");
});
test("replaceSemver can replace tilde semver range", () => {
  assert.equal(replaceSemver("~0.11.3", "0.12.0"), "~0.12.0");
});
test("replaceSemver can replace hat semver range", () => {
  assert.equal(replaceSemver("^1.13.1", "2.0.0"), "^2.0.0");
});
test("replaceSemver can replace semver range with prerelease (like Babel)", () => {
  assert.equal(
    replaceSemver("^7.0.0-beta.49", "7.0.0-beta.51"),
    "^7.0.0-beta.51"
  );
});
test("replaceSemver throws Error when too many diffs", () => {
  assert.throws(() => replaceSemver("^1.0.0-beta.1", "1.0.0-beta.202"));
});
