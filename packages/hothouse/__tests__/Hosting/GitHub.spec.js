/* eslint-env jest */
// @flow
import assert from "assert";
import parseGithubRepoUrl from "parse-github-repo-url";

test("`parse-github-repo-url` can parse GitHub url", () => {
  const [owner, repo] = parseGithubRepoUrl("https://github.com/Leko/hothouse");
  assert.deepStrictEqual([owner, repo], ["Leko", "hothouse"]);
});
