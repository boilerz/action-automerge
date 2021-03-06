import * as github from '@actions/github';
import { GitHub } from '@actions/github/lib/utils';

import * as gitHelper from '../git-helper';

describe('git-helper', () => {
  let getBranchProtection: jest.SpyInstance;
  let merge: jest.SpyInstance;
  let graphql: jest.SpyInstance;

  beforeAll(() => {
    github.context.payload = {
      pull_request: {
        node_id: '000001',
        title: 'Super feature',
        number: 42,
      },
    };
  });
  beforeEach(() => {
    getBranchProtection = jest.fn();
    merge = jest.fn();
    graphql = jest.fn();
    jest.spyOn(github, 'getOctokit').mockReturnValue(({
      graphql,
      repos: {
        getBranchProtection,
      },
      pulls: {
        merge,
      },
    } as unknown) as InstanceType<typeof GitHub>);
    jest.spyOn(github.context, 'repo', 'get').mockReturnValue({
      owner: 'octokit-fixture-org',
      repo: 'branch-protection',
    });
  });

  describe('#hasStatusCheck', () => {
    it('should return false when no status check are defined on the main branch', async () => {
      getBranchProtection.mockReturnValue({
        data: { required_status_checks: undefined },
      });
      await expect(gitHelper.hasStatusCheck('github.token')).resolves.toBe(
        false,
      );
    });

    it('should return true when status check are defined on the main branch', async () => {
      getBranchProtection.mockReturnValue({
        data: { required_status_checks: { non: 'empty' } },
      });
      await expect(gitHelper.hasStatusCheck('github.token')).resolves.toBe(
        true,
      );
    });
  });

  describe('#enableAutoMerge', () => {
    it('should enable automerge successfully', async () => {
      await gitHelper.enableAutoMerge('github.token');

      expect(graphql.mock.calls).toMatchInlineSnapshot(`
        Array [
          Array [
            "
          mutation enablePullRequestAutoMerge($pullRequestId: ID!, $commitHeadline: String!) {
            enablePullRequestAutoMerge(input: { pullRequestId: $pullRequestId, commitHeadline: $commitHeadline }) {
              clientMutationId
            }
          }
        ",
            Object {
              "commitHeadline": ":twisted_rightwards_arrows: Merge pull request #42 - Super feature",
              "pullRequestId": "000001",
            },
          ],
        ]
      `);
    });
  });

  describe('#merge', () => {
    it('should merge successfully', async () => {
      await gitHelper.merge('github.token');

      expect(merge.mock.calls).toMatchInlineSnapshot(`
        Array [
          Array [
            Object {
              "commit_message": ":twisted_rightwards_arrows: Merge pull request #42 - Super feature",
              "owner": "octokit-fixture-org",
              "pull_number": 42,
              "repo": "branch-protection",
            },
          ],
        ]
      `);
    });
  });
});
