// @flow
import fs from "fs";
import cp from "child_process";
import type { GitImpl } from "@hothouse/types";
const git = require("isomorphic-git"); // FIXME: Replace with import

const debug = require("debug")("hothouse:git");
const repo = {
  fs,
  dir: "."
};

const spawn = (bin: string, ...args: Array<string>): string => {
  const result = cp.spawnSync(bin, args, {
    encoding: "utf8"
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(result.stderr);
  }

  return result.stdout;
};

const impl: GitImpl = {
  async add(...paths: Array<string>): Promise<void> {
    debug("add", { paths });
    spawn("git", "add", ...paths);
  },

  async checkout(branchName: string): Promise<void> {
    debug("checkout", { branchName });
    spawn("git", "checkout", branchName);
  },

  async createBranch(branchName: string): Promise<void> {
    spawn("git", "checkout", "-b", branchName);
  },

  async deleteBranch(branchName: string): Promise<void> {
    spawn("git", "branch", "-D", branchName);
  },

  async commit(message: string): Promise<void> {
    debug("commit", message);
    spawn("git", "commit", "-m", message);
  },

  async push(token: string, remoteUrl: string, ref: string): Promise<void> {
    debug(`push`, { ref });
    spawn("git", "push", "origin", ref);
  },

  async getCurrentBranch(): Promise<string> {
    debug("getCurrentBranch");
    return spawn("git", "rev-parse", "--abbrev-ref", "HEAD").trim();
  },

  async inBranch(branchName: string, fn: () => any): Promise<void> {
    debug(`inBranch ${branchName}`);
    const currentBranch = await this.getCurrentBranch();
    try {
      await this.createBranch(branchName);
      await this.checkout(branchName);
      await fn();
      await this.checkout(currentBranch);
      await this.deleteBranch(branchName);
    } finally {
      await this.checkout(currentBranch);
    }
  }
};

export default impl;
