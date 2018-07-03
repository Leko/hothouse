/* eslint-env jest */
// @flow
import assert from "assert";
import Package, { replaceSemver } from "../src/Package";

test("Package.createFromDirectory can instantiate with valid directory", () => {
  const pkg = Package.createFromDirectory("../");
  assert.equal(pkg.constructor, Package);
});
test("Package.createFromDirectory cannot instantiate with invalid directory", () => {
  assert.throws(() => Package.createFromDirectory("./not-exists-path"));
});

test("Package can instantiate with valid package path", () => {
  const pkg = new Package("../package.json");
  assert.equal(pkg.constructor, Package);
});
test("Package cannot instantiate with invalid package path", () => {
  assert.throws(() => new Package("./not-exists-path.json"));
});

test("Package#getRepositoryUrl can resolve basic repository.url", () => {
  const pkg = new Package("../package.json");
  const url = "git+ssh://git@github.com/Leko/hothouse.git";
  pkg.pkgJson.repository = {
    type: "git",
    url
  };
  assert.equal(pkg.getRepositoryUrl(), url);
});
test("Package#getRepositoryUrl can resolve shortcut format (parse as GitHub)", () => {
  const pkg = new Package("../package.json");
  pkg.pkgJson.repository = "Leko/hothouse";
  assert.equal(
    pkg.getRepositoryUrl(),
    "git+ssh://git@github.com/Leko/hothouse.git"
  );
});
test("Package#getRepositoryUrl can resolve github shortcut format", () => {
  const pkg = new Package("../package.json");
  pkg.pkgJson.repository = "github:Leko/hothouse";
  assert.equal(
    pkg.getRepositoryUrl(),
    "git+https://github.com/Leko/hothouse.git"
  );
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
