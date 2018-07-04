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

const impl: GitImpl = {
  // This is temporary work around:
  // > Currently only the local $GIT_DIR/config file can be read or written.
  // > However support for the global ~/.gitconfig and system $(prefix)/etc/gitconfig will be added in the future.
  // > [config · isomorphic-git](https://isomorphic-git.github.io/docs/config.html)
  async loadConfig(): Promise<void> {
    if (await git.config({ ...repo, path: "user.name" })) {
      this.preserveLocalSettings = true;
    }
    const { stdout } = cp.spawnSync("git", ["config", "--get-regexp", "user"], {
      encoding: "utf8"
    });
    // $FlowFixMe(stdout-is-string)
    const author: { "user.name": string, "user.email": string } = stdout
      .split("\n")
      .map(line => line.split(" "))
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    const paths = ["user.name", "user.email"];
    for (let p of paths) {
      debug(`Try to set git config: ${p}=${author[p]}`);
      await git.config({ ...repo, path: p, value: author[p] });
    }
  },
  async restoreConfig(): Promise<void> {
    if (this.preserveLocalSettings) {
      debug("Git config exists from original so does nothing");
      return;
    }

    const paths = ["user.name", "user.email"];
    for (let p of paths) {
      debug(`Try to remove git config: ${p}`);
      cp.spawnSync("git", ["config", "--unset", p], { encoding: "utf8" });
    }
  },

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
