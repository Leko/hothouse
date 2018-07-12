/* eslint-env jest */
// @flow
import assert from "assert";
import type { Updates, ApplyResult, Reporter } from "@hothouse/types";
import Engine from "../src/Engine";

const gitImpl = {
  async add(...paths: Array<string>): Promise<void> {},
  async checkout(branchName: string): Promise<void> {},
  async createBranch(branchName: string): Promise<void> {},
  async commit(message: string): Promise<void> {},
  async push(token: string, ref?: string): Promise<void> {},
  async getCurrentBranch(): Promise<string> {
    return "master";
  },
  async inBranch(branchName: string, fn: () => any): Promise<void> {}
};
const reporter: Reporter = {
  async reportError(Error): Promise<void> {},
  async reportUpdates(
    cwd: string,
    allUpdates: { [string]: Updates }
  ): Promise<void> {},
  async reportApplyResult(
    cwd: string,
    applyResult: Array<ApplyResult>
  ): Promise<void> {}
};

describe("Engine#logPrefix", () => {
  test("Engine#logPrefix returns '(dryRun) ' when dryRun=true", () => {
    const engine = new Engine({
      concurrency: 1,
      token: "xxx",
      bail: false,
      ignore: [],
      perPackage: true,
      packageManager: null,
      repositoryStructure: null,
      dryRun: true,
      reporter,
      gitImpl
    });
    assert.equal(engine.logPrefix, "(dryRun) ");
  });
  test("Engine#logPrefix returns empty string when dryRun=false", () => {
    const engine = new Engine({
      concurrency: 1,
      token: "xxx",
      bail: false,
      ignore: [],
      perPackage: true,
      packageManager: null,
      repositoryStructure: null,
      dryRun: false,
      reporter,
      gitImpl
    });
    assert.equal(engine.logPrefix, "");
  });
});

// describe("Engine#getUpdates", () => {
//   const mock = (returns: Updates) =>
//     new class MockNpmClient extends Npm {
//       async getUpdates(packageDirectory: string): Promise<Updates> {
//         return returns;
//       }
//     }();

//   const assertFilter = async (
//     updates: Updates,
//     expected: Updates
//   ): Promise<void> => {
//     const engine = new Engine({
//       concurrency: 1,
//       token: "xxx",
//       bail: false,
//       ignore: [],
//       perPackage: true,
//       packageManager: null,
//       repositoryStructure: null,
//       dryRun: true,
//       reporter,
//       gitImpl
//     });

//     assert.deepStrictEqual(
//       await engine.getUpdates(mock(updates), "", []),
//       expected
//     );
//   };

//   test("Engine#getUpdates must ignore revert updates", async () => {
//     const expected = {
//       name: "prerelease+fixed",
//       current: "1.2.3-beta.30",
//       currentRange: "1.2.3-beta.30",
//       latest: "1.2.3-beta.32",
//       dev: false
//     };

//     await assertFilter(
//       [
//         {
//           name: "prerelease+tilde(ignored)",
//           current: "1.2.3-beta.30",
//           currentRange: "1.2.3-beta.30",
//           latest: "1.2.3-beta.29",
//           dev: false
//         },
//         expected
//       ],
//       [expected]
//     );
//   });

//   test("Engine#getUpdates must ignore covered updates (prerelease)", async () => {
//     const expected = {
//       name: "prerelease+fixed",
//       current: "1.2.3-beta.30",
//       currentRange: "1.2.3-beta.30",
//       latest: "1.2.3-beta.32",
//       dev: false
//     };

//     await assertFilter(
//       [
//         {
//           name: "prerelease+tilde(ignored)",
//           current: "1.2.3-beta.30",
//           currentRange: "~1.2.3-beta.30",
//           latest: "1.2.3-beta.32",
//           dev: false
//         },
//         expected
//       ],
//       [expected]
//     );
//   });

//   test("Engine#getUpdates must ignore covered updates (patch)", async () => {
//     const expected = [
//       {
//         name: "patch+fixed",
//         current: "1.2.3",
//         currentRange: "1.2.3",
//         latest: "1.2.4",
//         dev: false
//       }
//     ];

//     await assertFilter(
//       [
//         {
//           name: "patch+tilde(ignored)",
//           current: "1.2.3",
//           currentRange: "~1.2.3",
//           latest: "1.2.4",
//           dev: false
//         },
//         {
//           name: "patch+hat(ignored)",
//           current: "1.2.3",
//           currentRange: "^1.2.3",
//           latest: "1.2.4",
//           dev: false
//         },
//         ...expected
//       ],
//       expected
//     );
//   });

//   test("Engine#getUpdates must ignore covered updates (minor)", async () => {
//     const expected = [
//       {
//         name: "minor+fixed",
//         current: "1.2.3",
//         currentRange: "1.2.3",
//         latest: "1.3.0",
//         dev: false
//       },
//       {
//         name: "minor+tilde(ignored)",
//         current: "1.2.3",
//         currentRange: "~1.2.3",
//         latest: "1.3.0",
//         dev: false
//       }
//     ];

//     await assertFilter(
//       [
//         {
//           name: "minor+hat(ignored)",
//           current: "1.2.3",
//           currentRange: "^1.2.3",
//           latest: "1.3.0",
//           dev: false
//         },
//         ...expected
//       ],
//       expected
//     );
//   });

//   test("Engine#getUpdates must ignore covered updates (major)", async () => {
//     const expected = [
//       {
//         name: "major+fixed",
//         current: "1.2.3",
//         currentRange: "1.2.3",
//         latest: "2.0.0",
//         dev: false
//       },
//       {
//         name: "major+tilde(ignored)",
//         current: "1.2.3",
//         currentRange: "~1.2.3",
//         latest: "2.0.0",
//         dev: false
//       },
//       {
//         name: "major+hat(ignored)",
//         current: "1.2.3",
//         currentRange: "^1.2.3",
//         latest: "2.0.0",
//         dev: false
//       }
//     ];

//     await assertFilter(
//       [
//         {
//           name: "major+gt(ignored)",
//           current: "1.2.3",
//           currentRange: ">= 1.2.3",
//           latest: "2.0.0",
//           dev: false
//         },
//         ...expected
//       ],
//       expected
//     );
//   });
// });

describe("Engine#inBranch", () => {
  test("Engine#inBranch must not call GitImpl.inBranch when dryRun=true", () => {
    const engine = new Engine({
      concurrency: 1,
      token: "xxx",
      bail: false,
      ignore: [],
      perPackage: true,
      packageManager: null,
      repositoryStructure: null,
      dryRun: true,
      reporter,
      gitImpl
    });
    const spy = jest.spyOn(gitImpl, "inBranch");
    engine.inBranch("x", () => {});

    expect(spy).not.toHaveBeenCalled();

    spy.mockReset();
    spy.mockRestore();
  });
  test("Engine#inBranch must call GitImpl.inBranch when dryRun=false", () => {
    const engine = new Engine({
      concurrency: 1,
      token: "xxx",
      bail: false,
      ignore: [],
      perPackage: true,
      packageManager: null,
      repositoryStructure: null,
      dryRun: false,
      reporter,
      gitImpl
    });
    const spy = jest.spyOn(gitImpl, "inBranch");
    engine.inBranch("x", () => {});

    expect(spy).toHaveBeenCalled();

    spy.mockReset();
    spy.mockRestore();
  });
});
