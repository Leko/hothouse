/* eslint-env jest */
// @flow
import assert from "assert";
import Npm from "@hothouse/client-npm";
import SinglePackage from "../src/SinglePackage";
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

describe("Engine#logPrefix", () => {
  const packageManager = new Npm();
  const repositoryStructure = new SinglePackage();
  test("Engine#logPrefix returns '(dryRun) ' when dryRun=true", () => {
    const engine = new Engine({
      packageManager,
      repositoryStructure,
      dryRun: true,
      gitImpl
    });
    assert.equal(engine.logPrefix, "(dryRun) ");
  });
  test("Engine#logPrefix returns empty string when dryRun=false", () => {
    const engine = new Engine({
      packageManager,
      repositoryStructure,
      dryRun: false,
      gitImpl
    });
    assert.equal(engine.logPrefix, "");
  });
});

describe("Engine#inBranch", () => {
  const packageManager = new Npm();
  const repositoryStructure = new SinglePackage();
  test("Engine#inBranch must not call GitImpl.inBranch when dryRun=true", () => {
    const engine = new Engine({
      packageManager,
      repositoryStructure,
      dryRun: true,
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
      packageManager,
      repositoryStructure,
      dryRun: false,
      gitImpl
    });
    const spy = jest.spyOn(gitImpl, "inBranch");
    engine.inBranch("x", () => {});

    expect(spy).toHaveBeenCalled();

    spy.mockReset();
    spy.mockRestore();
  });
});
