
Thanks for contributing to **blade-web3.js**!

As a contributor, here are the guidelines we would like you to follow:
* Ensure `npm build` runs without errors before submitting a Pull Request
* Features and bug fixes should be covered by new test cases
* Commits follow the [Angular commit convention](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines)

## Creating releases

We use [semantic-release](https://github.com/semantic-release/semantic-release)
to release new versions from the `master` branch:
*  Commits of type `fix` will trigger bugfix releases, think `0.0.1`
*  Commits of type `feat` will trigger feature releases, think `0.1.0`
*  Commits with `BREAKING CHANGE` in body or footer will trigger breaking releases, think `1.0.0`

All other commit types will not result in a new release.

## Reference

### Static Analysis
tslint and TypeScript are used.

### API Documentation
TypeDoc is used to document the public API.  See
https://typedoc.org/ for details.
