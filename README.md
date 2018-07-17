# Hothouse

[![npm](https://img.shields.io/npm/v/hothouse.svg)](https://www.npmjs.com/package/hothouse)
[![license](https://img.shields.io/github/license/Leko/hothouse.svg)](https://opensource.org/licenses/MIT)
[![CircleCI](https://circleci.com/gh/Leko/hothouse.svg?style=svg)](https://circleci.com/gh/Leko/hothouse)
[![codecov](https://codecov.io/gh/Leko/hothouse/branch/master/graph/badge.svg)](https://codecov.io/gh/Leko/hothouse)

Continuous dependency update for Node.js project like [Greenkeeper](https://greenkeeper.io/).

![demo](./docs/demo.svg)
![image](https://user-images.githubusercontent.com/1424963/42268316-23121072-7fb6-11e8-8238-6a97ea7c3779.png)

## Feature

- Support npm/yarn
- Support monorepo (Currently, supported [lerna](https://github.com/lerna/lerna) and [Yarn workspaces](https://yarnpkg.com/en/docs/workspaces))
- Mergeable pull request
  - Each pull request separated by single package update.
  - [example1](https://github.com/Leko/zapshot/pull/25), [example2](https://github.com/Leko/zapshot/pull/23)
- Extensible
  - Support some npm client by your plugin
  - Support some monorepo tools by your plugin

## Install

### Requirement

- Node.js 8+

```
npm i -g hothouse
```

## Usage

```
$ hothouse --help
$ hothouse -t {GITHUB_PERSONAL_TOKEN}
```

Please create a new [personal access token](https://github.com/settings/tokens/new).
`hothouse` need to permission `public_repo`. And use it with `--token` option.

If your packages depends on private repository, please add permission `repo` (Full control of private repositories).

### Run hothouse regularly

`hothouse` expects scheduled jobs to run periodically rather than manually.

Some CI service support scheduling job.  
Please configure scheduled job to run periodically.

- [Cron Jobs - Travis CI](https://docs.travis-ci.com/user/cron-jobs/#Adding-Cron-Jobs)
- [Orchestrating Workflows - CircleCI](https://circleci.com/docs/2.0/workflows/#nightly-example)

Or you can see [our actual config for CircleCI](https://github.com/Leko/hothouse/blob/master/.circleci/config.yml#L10).
If you want to add other CI service guide, please send a pull request :)

### Debug

If you want to debug hothouse, please run with `DEBUG` environment variable like

```
DEBUG=hothouse* hothouse
```

## Contribution

1.  Fork this repo
1.  Create your branch like `fix-hoge-foo-bar` `add-hige`
1.  Write your code
1.  Pass all checks (`npm run lint && npm run flow && npm test`)
1.  Commit with [gitmoji](https://gitmoji.carloscuesta.me/)
1.  Submit pull request to `master` branch

## Development

```
git clone git@github.com:Leko/hothouse.git
cd hothouse
npm i
npm run bootstrap
```

## License

This package under [MIT](https://opensource.org/licenses/MIT) license.
