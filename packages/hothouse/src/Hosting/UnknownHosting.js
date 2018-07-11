// @flow
import type { Hosting, PullRequest } from "@hothouse/types";

export default class UnknownHosting implements Hosting {
  async match(repositoryUrl: string): Promise<boolean> {
    return true;
  }

  async tagExists(
    token: string,
    repositoryUrl: string,
    tag: string
  ): Promise<boolean> {
    return false;
  }

  async shaToTag(
    token: string,
    repositoryUrl: string,
    sha: string
  ): Promise<string> {
    return "unknown";
  }

  async tagToReleaseNote(
    token: string,
    repositoryUrl: string,
    tag: string
  ): Promise<?string> {
    return "";
  }

  async getCompareUrl(
    token: string,
    repositoryUrl: string,
    base: string,
    head: string
  ): Promise<string> {
    return "";
  }

  async createPullRequest(
    token: string,
    repositoryUrl: string,
    base: string,
    head: string,
    title: string,
    body: string
  ): Promise<PullRequest> {
    return { url: "" };
  }

  async getDefaultBranch(
    token: string,
    repositoryUrl: string
  ): Promise<string> {
    return "";
  }
}
