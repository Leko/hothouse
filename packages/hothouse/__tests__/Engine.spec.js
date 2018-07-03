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
