/* eslint-env jest */
// @flow
import assert from "assert";
import { replace } from "../../src/utils/semver";

test("replace can replace exact semver", () => {
  assert.equal(replace("1.2.3", "4.5.6"), "4.5.6");
});
test("replace can replace tilde semver range", () => {
  assert.equal(replace("~0.11.3", "0.12.0"), "~0.12.0");
});
test("replace can replace hat semver range", () => {
  assert.equal(replace("^1.13.1", "2.0.0"), "^2.0.0");
});
test("replace can replace semver range with prerelease (like Babel)", () => {
  assert.equal(replace("^7.0.0-beta.49", "7.0.0-beta.51"), "^7.0.0-beta.51");
});
test("replace throws Error when too many diffs", () => {
  assert.throws(() => replace("^1.0.0-beta.1", "1.0.0-beta.202"));
});
