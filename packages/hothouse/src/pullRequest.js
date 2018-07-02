// @flow
import Mustache from "mustache";
import type { UpdateDetails } from "@hothouse/types";

const titleTemplate = `Update {{&packages}} to the latest version`;

const bodyTemplate = `
## Version **{{latest}}** of **{{&name}}** was just published.

* Package: {{#repositoryUrl}}[repository]({{&repositoryUrl}}), {{/repositoryUrl}}[npm](https://www.npmjs.com/package/{{&name}})
* Current Version: {{current}}
* Dev: {{dev}}
{{#compareUrl}}* [compare {{current}} to {{latest}} diffs]({{&compareUrl}}){{/compareUrl}}

The version(\`{{latest}}\`) is **not covered** by your current version range(\`{{currentRange}}\`).

{{#releaseNote}}
<details>
<summary>Release Notes</summary>
{{&releaseNote}}
</details>
{{/releaseNote}}
{{^releaseNote}}
Release note is not available
{{/releaseNote}}
`.trim();

export const createPullRequestTitle = (updateDetails: UpdateDetails): string =>
  Mustache.render(titleTemplate, {
    packages: updateDetails.map(detail => detail.name).join(", ")
  });

export const createPullRequestMessage = (
  updateDetails: UpdateDetails
): string =>
  updateDetails
    .map(detail => Mustache.render(bodyTemplate, detail))
    .concat([
      "Powered by [hothouse](https://github.com/Leko/hothouse) :honeybee:"
    ])
    .join("\n\n----------------------------------------\n\n");
