// @flow

export const getTagsQuery = (owner: string, name: string) => `
query {
  repository(owner: "${owner}", name: "${name}") {
    refs(refPrefix: "refs/tags/", first: 100, orderBy: {field: TAG_COMMIT_DATE, direction: DESC}) {
      nodes {
        name
      }
    }
  }
}
`;
