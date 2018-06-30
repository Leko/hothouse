/* eslint-env jest */
// @flow
import assert from "assert";
import { parseRepositoryUrl } from "../../src/Hosting/GitHub";

test("parseRepositoryUrl can git+ssh url", () => {
  const [owner, repo] = parseRepositoryUrl(
    "git+ssh://git@github.com/Leko/hothouse.git"
  );
  assert.deepStrictEqual([owner, repo], ["Leko", "hothouse"]);
});
test("parseRepositoryUrl can basic http url", () => {
  const [owner, repo] = parseRepositoryUrl("https://github.com/Leko/hothouse");
  assert.deepStrictEqual([owner, repo], ["Leko", "hothouse"]);
});
test("parseRepositoryUrl can parse monorepo url", () => {
  const [owner, repo] = parseRepositoryUrl(
    "https://github.com/babel/babel/tree/master/packages/babel-cli"
  );
  assert.deepStrictEqual([owner, repo], ["babel", "babel"]);
});
