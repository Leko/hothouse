// @flow
export default class UnknownHosting implements Hosting {
  async match(repositoryUrl: string): Promise<boolean> {
    return true;
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
}
