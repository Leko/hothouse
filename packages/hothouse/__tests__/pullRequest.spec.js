/* eslint-env jest */
// @flow
import assert from "assert";
import {
  createPullRequestTitle,
  createPullRequestMessage
} from "../src/pullRequest";

test("createPullRequestTitle can concat package names format as CSV", () => {
  const base = {
    current: "1.2.3",
    currentRange: "^1.2.3",
    latest: "3.4.5",
    dev: false,
    repositoryUrl: null,
    compareUrl: null,
    releaseNote: null
  };

  const title = createPullRequestTitle([
    { ...base, name: "hoge" },
    { ...base, name: "foo" },
    { ...base, name: "bar" }
  ]);
  assert.strictEqual(title, "Update hoge, foo, bar to the latest version");
});

test("createPullRequestMessage must present repository link when repositoryUrl is passed", () => {
  const body = createPullRequestMessage([
    {
      name: "@scope/pkg",
      current: "1.2.3-beta.30",
      currentRange: "^1.2.3",
      latest: "2.0.0",
      dev: false,
      repositoryUrl: "https://github.com/pkg/pkg",
      compareUrl: null,
      releaseNote: null
    }
  ]);
  assert.ok(body.includes("Package: [repository](https://github.com/pkg/pkg)"));
});
test("createPullRequestMessage must not present repository link when repositoryUrl is null", () => {
  const body = createPullRequestMessage([
    {
      name: "@scope/pkg",
      current: "1.2.3-beta.30",
      currentRange: "^1.2.3",
      latest: "2.0.0",
      dev: false,
      repositoryUrl: null,
      compareUrl: null,
      releaseNote: null
    }
  ]);
  assert.ok(
    !body.includes("Package: [repository](https://github.com/pkg/pkg)")
  );
});
test("createPullRequestMessage must present compare URL when compareUrl is passed", () => {
  const body = createPullRequestMessage([
    {
      name: "@scope/pkg",
      current: "1.2.3-beta.30",
      currentRange: "^1.2.3",
      latest: "2.0.0",
      dev: false,
      repositoryUrl: null,
      compareUrl: "https://github.com/pkg/pkg/compare/v1.2.3-beta.30...v2.0.0",
      releaseNote: null
    }
  ]);
  assert.ok(
    body.includes(
      "* [compare 1.2.3-beta.30 to 2.0.0 diffs](https://github.com/pkg/pkg/compare/v1.2.3-beta.30...v2.0.0)"
    )
  );
});
test("createPullRequestMessage must not present compare URL when compareUrl is null", () => {
  const body = createPullRequestMessage([
    {
      name: "@scope/pkg",
      current: "1.2.3-beta.30",
      currentRange: "^1.2.3",
      latest: "2.0.0",
      dev: false,
      repositoryUrl: null,
      compareUrl: null,
      releaseNote: null
    }
  ]);
  assert.ok(
    !body.includes(
      "* [compare 1.2.3-beta.30 to 2.0.0 diffs](https://github.com/pkg/pkg/compare/v1.2.3-beta.30...v2.0.0)"
    )
  );
});
test("createPullRequestMessage must present release note when releaseNote is passed", () => {
  const body = createPullRequestMessage([
    {
      name: "@scope/pkg",
      current: "1.2.3-beta.30",
      currentRange: "^1.2.3",
      latest: "2.0.0",
      dev: false,
      repositoryUrl: null,
      compareUrl: null,
      releaseNote: "<h2>Some updates</h2>"
    }
  ]);
  assert.ok(body.includes("<details>"), body);
  assert.ok(body.includes("<h2>Some updates</h2>"), body);
});
test("createPullRequestMessage must not present release note when releaseNote is null", () => {
  const body = createPullRequestMessage([
    {
      name: "@scope/pkg",
      current: "1.2.3-beta.30",
      currentRange: "^1.2.3",
      latest: "2.0.0",
      dev: false,
      repositoryUrl: null,
      compareUrl: null,
      releaseNote: null
    }
  ]);
  assert.ok(!body.includes("<details>"));
  assert.ok(body.includes("Release note is not available"));
});
