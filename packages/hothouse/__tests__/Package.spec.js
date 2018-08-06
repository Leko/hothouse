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
test("Package#getRepositoryHttpsUrl can resolve https protocol", () => {
  const pkg = new Package("../package.json");
  pkg.pkgJson.repository = "https://github.com/Leko/hothouse.git";
  assert.equal(
    pkg.getRepositoryHttpsUrl(),
    "https://github.com/Leko/hothouse.git"
  );
});
test("Package#getRepositoryHttpsUrl can resolve git+https protocol", () => {
  const pkg = new Package("../package.json");
  pkg.pkgJson.repository = "git+https://github.com/Leko/hothouse.git";
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
test("Package#getRepositoryHttpsUrl throws when repository.url is not defined with pkgJsonPath", () => {
  const pkg = new Package("../package.json");
  delete pkg.pkgJsonNormalized.repository;
  assert.throws(
    () => pkg.getRepositoryHttpsUrl(),
    new RegExp(`repository.url is not defined in ../package.json`)
  );
});
test("Package#getRepositoryHttpsUrl throws when repository.url is not defined without pkgJsonPath", () => {
  const pkgJson = require("../package.json");
  const pkg = new Package(pkgJson);
  delete pkg.pkgJsonNormalized.repository;
  assert.throws(
    () => pkg.getRepositoryHttpsUrl(),
    new RegExp(`repository.url is not defined in ${pkgJson.name}`)
  );
});
