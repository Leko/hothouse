// @flow
import { URL } from "url";
import octokit from "@octokit/rest";
import type { Hosting } from "@hothouse/types";
import { fromUrl } from "hosted-git-info";
import { getTagsQuery } from "./graphql";

export const parseRepositoryUrl = (url: string): [string, string] => {
  const parsed = fromUrl(url);
  if (!parsed) {
    const urlObj = new URL(url);
    const [owner, repo] = urlObj.pathname.split("/").slice(1);
    return [owner, repo];
  }
  const { user, project } = parsed;
  return [user, project];
};

export default class GitHub implements Hosting {
  async match(repositoryUrl: string): Promise<boolean> {
    return repositoryUrl.toLowerCase().includes("github");
  }

  async tagExists(
    token: string,
    repositoryUrl: string,
    tag: string
  ): Promise<boolean> {
    const client = this.prepare(token);
    const [owner, repo] = parseRepositoryUrl(repositoryUrl);
    // FIXME: Currently, get 100 tags order by commited date but it's not incomplete.
    //        We shuold get all tags and compare it.
    const { data } = await client.request({
      method: "POST",
      url: "/graphql",
      query: getTagsQuery(owner, repo)
    });

    return data.data.repository.refs.nodes.some(({ name }) => name === tag);
  }

  async shaToTag(
    token: string,
    repositoryUrl: string,
    sha: string
  ): Promise<string> {
    const client = this.prepare(token);
    const [owner, repo] = parseRepositoryUrl(repositoryUrl);

    const PER_PAGE = 100;
    let page = 1;
    while (1) {
      const res = await client.repos.getTags({
        owner,
        repo,
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
    const client = this.prepare(token);
    const [owner, repo] = parseRepositoryUrl(repositoryUrl);
    try {
      const release = await client.repos.getReleaseByTag({ owner, repo, tag });
      const markdown = `# ${release.data.name}\n${release.data.body}`;
      return markdown;
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
    const client = this.prepare(token);
    const [owner, repo] = parseRepositoryUrl(repositoryUrl);
    const result = await client.repos.compareCommits({
      owner,
      repo,
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
    const client = this.prepare(token);
    const [owner, repo] = parseRepositoryUrl(repositoryUrl);
    const result = await client.pullRequests.create({
      owner,
      repo,
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
    const client = this.prepare(token);
    const [owner, repo] = parseRepositoryUrl(repositoryUrl);
    const result = await client.repos.get({ owner, repo });
    return result.data.default_branch;
  }

  prepare(token: string) {
    const client = octokit();
    client.authenticate({
      type: "token",
      token
    });

    return client;
  }
}
