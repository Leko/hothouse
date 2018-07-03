// @flow
import fs from "fs";
import type { GitImpl } from "@hothouse/types";
const git = require("isomorphic-git"); // FIXME: Replace with import

const debug = require("debug")("hothouse:git");
const repo = {
  fs,
  dir: "."
};

const impl: GitImpl = {
  async add(...paths: Array<string>): Promise<void> {
    debug("add", { paths });
    for (let filepath of paths) {
      try {
        await git.add({ ...repo, filepath });
      } catch (error) {
        debug(error.stack);
      }
    }
  },

  async checkout(branchName: string): Promise<void> {
    debug("checkout", { branchName });
    await git.checkout({ ...repo, ref: branchName });
  },

  async createBranch(branchName: string): Promise<void> {
    debug("createBranch", { branchName });
    await git.branch({ ...repo, ref: branchName });
  },

  async commit(message: string): Promise<void> {
    debug("commit", message);
    await git.commit({ ...repo, message });
  },

  async push(token: string, ref?: string): Promise<void> {
    debug(`push`, { ref });
    await git.push({ ...repo, token, ref });
  },

  async getCurrentBranch(): Promise<string> {
    debug("getCurrentBranch");
    return git.currentBranch({ ...repo });
  },

  async inBranch(branchName: string, fn: () => any): Promise<void> {
    debug(`inBranch ${branchName}`);
    const currentBranch = await this.getCurrentBranch();
    try {
      await this.createBranch(branchName);
      await this.checkout(branchName);
      await fn();
    } finally {
      await this.checkout(currentBranch);
    }
  }
};

export default impl;
