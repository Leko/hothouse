# hothouse

[![npm](https://img.shields.io/npm/v/hothouse.svg)](https://www.npmjs.com/package/hothouse)
[![license](https://img.shields.io/github/license/Leko/hothouse.svg)](https://opensource.org/licenses/MIT)
[![CircleCI](https://circleci.com/gh/Leko/hothouse.svg?style=svg)](https://circleci.com/gh/Leko/hothouse)
[![codecov](https://codecov.io/gh/Leko/hothouse/branch/master/graph/badge.svg)](https://codecov.io/gh/Leko/hothouse)

Continuous dependency update for Node.js project like [Greenkeeper](https://greenkeeper.io/).

## Install

### Requirement

- Node.js 8+

```
npm i -g hothouse
```

## Usage

```
$ hothouse --help
```

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
