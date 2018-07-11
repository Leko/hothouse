// @flow
import type { Hosting } from "@hothouse/types";
import type Package from "../Package";
import GitHub from "./GitHub";
import UnknownHosting from "./UnknownHosting";

const hostings = [new GitHub()];

export { GitHub, UnknownHosting };

export const detect = async (pkg: Package): Promise<Hosting> => {
  const repositoryUrl = pkg.getRepositoryHttpsUrl();
  if (!repositoryUrl) {
    return new UnknownHosting();
  }

  for (let hosting of hostings) {
    if (await hosting.match(repositoryUrl)) {
      return hosting;
    }
  }

  return new UnknownHosting();
};
