import process from 'process';

import * as core from '@actions/core';
import * as github from '@actions/github';

import * as gitHelper from './git-helper';
import { PullRequest } from './git-helper';

interface RunOptions {
  labels?: string;
  githubToken?: string;
  githubEmail: string;
  githubUser: string;
}

export const defaultRunOptions: RunOptions = {
  labels: 'automerge',
  githubToken: process.env.GITHUB_TOKEN,
  githubEmail:
    process.env.GITHUB_EMAIL || '77937117+boilerz-bot@users.noreply.github.com',
  githubUser: process.env.GITHUB_USER || 'boilerz-bot',
};

export default async function run(
  options: RunOptions = defaultRunOptions,
): Promise<void> {
  const requiredLabels: string[] = core.getInput('labels').split(',');

  try {
    if (!options.githubToken) {
      core.setFailed(`⛔️ Missing GITHUB_TOKEN`);
      return;
    }

    if (!github.context.eventName.startsWith('pull_request')) {
      core.info(`⚠️ Not a PR event, passing: ${github.context.eventName}`);
      return;
    }

    const pullRequest = github.context.payload.pull_request as PullRequest;
    const pullRequestLabels = pullRequest.labels.map(({ name }) => name!);

    if (pullRequest.auto_merge) {
      core.info('⏩ Auto merge already enabled');
      return;
    }

    if (
      requiredLabels.length &&
      !pullRequestLabels.some((label) => requiredLabels.includes(label))
    ) {
      core.info(
        `🚫 Missing required labels => required: [${requiredLabels}], found: [${pullRequestLabels}]`,
      );
      return;
    }

    if (!(await gitHelper.hasStatusCheck(options.githubToken))) {
      core.info('❌ No status check found on the main branch, passing');
      return;
    }

    core.info(
      `🔀 Mergeable: ${pullRequest.mergeable} - state: ${pullRequest.mergeable_state}`,
    );
    if (pullRequest.mergeable && pullRequest.mergeable_state === 'clean') {
      core.info('🔀 Merging branch');
      await gitHelper.merge(options.githubToken);
    } else {
      core.info(
        `🔀 Enabling auto merge on the PR #${pullRequest.number} (${pullRequest.node_id})`,
      );
      await gitHelper.enableAutoMerge(options.githubToken);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

/* istanbul ignore if */
if (!module.parent) {
  run();
}
