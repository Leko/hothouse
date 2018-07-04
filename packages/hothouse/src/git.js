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

const configPaths = ["user.name", "user.email"];
const defaultConfig = {
  "user.name": "hothouse",
  "user.email": "hothouse@example.com"
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

    for (let p of configPaths) {
      let value = author[p];
      if (!value) {
        debug(
          `config ${p} does not exists, set default value (${defaultConfig[p]})`
        );
        value = defaultConfig[p];
      }
      debug(`Try to set git config: ${p}=${value}`);
      await git.config({ ...repo, path: p, value: value });
    }
  },
  async restoreConfig(): Promise<void> {
    if (this.preserveLocalSettings) {
      debug("Git config exists from original so does nothing");
      return;
    }

    for (let p of configPaths) {
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

  // FIXME: Ignore file mode changes
  // https://github.com/isomorphic-git/isomorphic-git/issues/276
  async checkout(branchName: string): Promise<void> {
    debug("checkout", { branchName });
    // await git.checkout({ ...repo, ref: branchName });
    cp.spawnSync("git", ["checkout", branchName], {
      encoding: "utf8",
      stdio: "inherit"
    });
  },

  async createBranch(branchName: string): Promise<void> {
    debug("createBranch", { branchName });
    await git.branch({ ...repo, ref: branchName });
  },

  async commit(message: string): Promise<void> {
    debug("commit", message);
    // await git.commit({ ...repo, message });
    cp.spawnSync("git", ["commit", "-m", message], {
      encoding: "utf8",
      stdio: "inherit"
    });
  },

  async push(token: string, remoteUrl: string, ref: string): Promise<void> {
    debug(`push`, { ref });
    // await git.push({ ...repo, token, ref, url: remoteUrl });
    cp.spawnSync("git", ["push", "origin", ref], {
      encoding: "utf8",
      stdio: "inherit"
    });
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
