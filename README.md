# @boilerz/action-release

[![GH CI Action](https://github.com/boilerz/action-release/workflows/CI/badge.svg)](https://github.com/boilerz/action-release/actions?query=workflow:CI)
[![codecov](https://codecov.io/gh/boilerz/action-release/branch/master/graph/badge.svg)](https://codecov.io/gh/boilerz/action-release)

> Github action that merge or enable auto merge for PRs

### Usage

See [action.yml](action.yml)

Basic:
```yaml
name: Auto merge

on:
  pull_request:
    types:
      - labeled
      - unlabeled
      - synchronize
      - opened
      - edited
      - ready_for_review
      - reopened
      - unlocked
  pull_request_review:
    types:
      - submitted
  check_suite:
    types:
      - completed
  status: {}

jobs:
  automerge:
    runs-on: ubuntu-latest
    steps:
      - uses: boilerz/action-automerge@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

```
