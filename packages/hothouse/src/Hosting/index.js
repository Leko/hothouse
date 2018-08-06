// @flow
import type { Hosting } from "@hothouse/types";
import type Package from "../Package";
import GitHub from "./GitHub";
import UnknownHosting from "./UnknownHosting";

const hostings = [new GitHub()];

export { GitHub, UnknownHosting };

export const detect = async (pkg: Package): Promise<Hosting> => {
  if (!pkg.hasRepositoryUrl()) {
    return new UnknownHosting();
  }

  const repositoryUrl = pkg.getRepositoryHttpsUrl();
  for (let hosting of hostings) {
    if (await hosting.match(repositoryUrl)) {
      return hosting;
    }
  }

  return new UnknownHosting();
};
