import * as core from '@actions/core';
import * as github from '@actions/github';
import type { components } from '@octokit/openapi-types';

export type PullRequest = components['schemas']['pull-request'];

const enablePullRequestAutoMergeMutation = `
  mutation enablePullRequestAutoMerge($pullRequestId: ID!, $commitHeadline: String!) {
    enablePullRequestAutoMerge(input: { pullRequestId: $pullRequestId, commitHeadline: $commitHeadline }) {
      clientMutationId
    }
  }
`;

export async function hasStatusCheck(
  githubToken: string,
  mainBranch: string = 'master',
): Promise<boolean> {
  try {
    const octokit = github.getOctokit(githubToken);
    const { data: branch } = await octokit.repos.getBranchProtection({
      ...github.context.repo,
      branch: mainBranch,
    });
    return !!branch.required_status_checks;
  } catch (err) {
    core.error(`💥 [hasStatusCheck] ${err.message}`);
    return false;
  }
}

function buildMergeCommitMessage(): string {
  const { number, title } = github.context.payload.pull_request!;
  return `:twisted_rightwards_arrows: Merge pull request #${number} - ${title}`;
}

export async function enableAutoMerge(githubToken: string): Promise<void> {
  const octokit = github.getOctokit(githubToken);
  await octokit.graphql(enablePullRequestAutoMergeMutation, {
    pullRequestId: github.context.payload.pull_request?.node_id,
    commitHeadline: buildMergeCommitMessage(),
  });
}

export async function merge(githubToken: string): Promise<void> {
  const octokit = github.getOctokit(githubToken);
  await octokit.pulls.merge({
    ...github.context.repo,
    commit_message: buildMergeCommitMessage(),
    pull_number: github.context.payload.pull_request!.number,
  });
}
