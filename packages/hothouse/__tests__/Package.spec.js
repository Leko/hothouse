/* eslint-env jest */
// @flow
import assert from "assert";
import Package from "../src/Package";

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

test("Package#getRepositoryHttpsUrl can resolve basic repository.url as https", () => {
  const pkg = new Package("../package.json");
  const url = "git+ssh://git@github.com/Leko/hothouse.git";
  pkg.pkgJson.repository = {
    type: "git",
    url
  };
  assert.equal(
    pkg.getRepositoryHttpsUrl(),
    "https://github.com/Leko/hothouse.git"
  );
});
test("Package#getRepositoryHttpsUrl can resolve shortcut format (parse as GitHub) as https", () => {
  const pkg = new Package("../package.json");
  pkg.pkgJson.repository = "Leko/hothouse";
  assert.equal(
    pkg.getRepositoryHttpsUrl(),
    "https://github.com/Leko/hothouse.git"
  );
});
test("Package#getRepositoryHttpsUrl can resolve github shortcut format", () => {
  const pkg = new Package("../package.json");
  pkg.pkgJson.repository = "github:Leko/hothouse";
  assert.equal(
    pkg.getRepositoryHttpsUrl(),
    "https://github.com/Leko/hothouse.git"
  );
});
