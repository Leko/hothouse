// @flow
import Lerna from "./Lerna";
import SinglePackage from "./SinglePackage";
import YarnWorkspaces from "./YarnWorkspaces";

export default [new Lerna(), new YarnWorkspaces(), new SinglePackage()];
export { Lerna, SinglePackage, YarnWorkspaces };
