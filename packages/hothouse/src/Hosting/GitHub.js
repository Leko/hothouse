// @flow
import parse from "git-url-parse";
import octokit from "@octokit/rest";
import type { Hosting } from "@hothouse/types";

const client = octokit();

export default class GitHub implements Hosting {
  async match(repositoryUrl: string): Promise<boolean> {
    return repositoryUrl.toLowerCase().includes("github");
  }

  async shaToTag(
    token: string,
    repositoryUrl: string,
    sha: string
  ): Promise<string> {
    const { owner, name } = parse(repositoryUrl);
    // /repos/yargs/yargs/git/tags/57a39cb8fe5051b9d9bb87fb789cc0d6d2363ce6
    client.authenticate({
      type: "token",
      token
    });

    const PER_PAGE = 100;
    let page = 1;
    while (1) {
      const res = await client.repos.getTags({
        owner,
        repo: name,
        per_page: PER_PAGE,
        page
      });
      const tag = res.data.find(({ commit }) => commit.sha === sha);
      if (tag) {
        return tag.name;
      }
      if (!client.hasNextPage(res)) {
        break;
      }
      page++;
    }
    throw new Error(`Cannot resolve sha: ${sha}`);
  }

  async tagToReleaseNote(
    token: string,
    repositoryUrl: string,
    tag: string
  ): Promise<?string> {
    const { owner, name } = parse(repositoryUrl);
    try {
      return await client.repos.getReleaseByTag({ owner, repo: name, tag });
    } catch (error) {
      if (JSON.parse(error.message).message === "Not Found") {
        return null;
      }
      throw error;
    }
  }

  async getCompareUrl(
    token: string,
    repositoryUrl: string,
    base: string,
    head: string
  ): Promise<string> {
    const { owner, name } = parse(repositoryUrl);
    const result = await client.repos.compareCommits({
      owner,
      repo: name,
      base,
      head
    });
    return result.data.html_url;
  }

  async createPullRequest(
    token: string,
    repositoryUrl: string,
    base: string,
    head: string,
    title: string,
    body: string
  ): Promise<string> {
    const { owner, name } = parse(repositoryUrl);
    const result = await client.pullRequests.create({
      owner,
      repo: name,
      base,
      head,
      title,
      body
    });
    return result.data.html_url;
  }

  async getDefaultBranch(
    token: string,
    repositoryUrl: string
  ): Promise<string> {
    const { owner, name } = parse(repositoryUrl);
    const result = await client.repos.get({ owner, repo: name });
    return result.data.default_branch;
  }
}
