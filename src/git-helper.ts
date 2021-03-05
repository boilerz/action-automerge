import * as github from '@actions/github';
import type { components } from '@octokit/openapi-types';

export type PullRequest = components['schemas']['pull-request'];

const enablePullRequestAutoMergeMutation = `
  mutation enablePullRequestAutoMerge($pullRequestId: ID!) {
    enablePullRequestAutoMerge(input: { pullRequestId: $pullRequestId }) {
      clientMutationId
    }
  }
`;

export async function hasStatusCheck(
  githubToken: string,
  mainBranch: string = 'master',
): Promise<boolean> {
  const octokit = github.getOctokit(githubToken);
  const { data: branch } = await octokit.repos.getBranchProtection({
    ...github.context.repo,
    branch: mainBranch,
  });
  return !!branch.required_status_checks;
}

export async function enableAutoMerge(githubToken: string): Promise<void> {
  const octokit = github.getOctokit(githubToken);
  await octokit.graphql(enablePullRequestAutoMergeMutation, {
    pullRequestId: github.context.payload.pull_request?.node_id,
  });
}

export async function merge(githubToken: string): Promise<void> {
  const octokit = github.getOctokit(githubToken);
  await octokit.pulls.merge({
    ...github.context.repo,
    pull_number: github.context.payload.pull_request?.number!,
  });
}
