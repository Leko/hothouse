/* eslint-env jest */
// @flow
import assert from "assert";
import { tmpdir } from "os";
import fs from "fs";
import { sep } from "path";
import rimraf from "rimraf";
import { spawnSync } from "child_process";
import git from "../src/git";

describe("git", () => {
  const workDir = fs.mkdtempSync(`${tmpdir()}${sep}`);
  const original = process.cwd();
  beforeEach(() => {
    if (!fs.existsSync(workDir)) {
      fs.mkdirSync(workDir);
    }
    process.chdir(workDir);
    spawnSync("git", ["init"], { cwd: workDir });
    spawnSync("git", ["commit", "--allow-empty", "-m", "Initial commit"], {
      cwd: workDir
    });
  });
  afterEach(() => {
    rimraf.sync(workDir);
    process.chdir(original);
  });

  test("git.getCurrentBranch can return current branch", async () => {
    assert.strictEqual(await git.getCurrentBranch(), "master");
  });
  test("git.getCurrentBranch can return current branch after checkout another branch", async () => {
    const branch = "hoge";
    spawnSync("git", ["checkout", "-b", branch], { cwd: workDir });
    assert.strictEqual(await git.getCurrentBranch(), branch);
  });

  test("git.inBranch can checkout current when error occured in callback", async () => {
    const currentBranch = await git.getCurrentBranch();
    try {
      await git.inBranch("test-branch", async () => {
        throw new Error("Some error");
      });
    } catch (error) {
      assert.strictEqual(error.message, "Some error");
      assert.strictEqual(await git.getCurrentBranch(), currentBranch);
    }
  });
  test("git.inBranch can checkout current when callback successful", async () => {
    const currentBranch = await git.getCurrentBranch();
    const brannch = "test-branch";
    await git.inBranch(brannch, async () => {
      assert.strictEqual(await git.getCurrentBranch(), brannch);
    });
    assert.strictEqual(await git.getCurrentBranch(), currentBranch);
  });
});
