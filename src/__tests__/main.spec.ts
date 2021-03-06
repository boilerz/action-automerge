import * as core from '@actions/core';
import * as github from '@actions/github';

import * as gitHelper from '../git-helper';
import run, { defaultRunOptions } from '../main';

jest.mock('@actions/core');
jest.mock('@actions/github');
jest.mock('../git-helper');

describe('gh action', () => {
  beforeEach(() => {
    (core.getInput as jest.Mock).mockReturnValue('automerge');
    (gitHelper.hasStatusCheck as jest.Mock).mockResolvedValue(true);
    github.context.eventName = 'pull_request';
    const pullRequest = {
      number: 42,
      node_id: '000001',
      auto_merge: false,
      labels: [{ name: 'automerge' }],
      mergeable: true,
      mergeable_state: 'clean',
    };
    (gitHelper.getContextualPullRequest as jest.Mock).mockReturnValue(
      pullRequest,
    );
    github.context.payload = {
      pull_request: pullRequest,
    };
  });
  it('should fail without github token', async () => {
    await run({
      ...defaultRunOptions,
      githubToken: undefined,
    });

    expect(core.setFailed).toMatchInlineSnapshot(`
      [MockFunction] {
        "calls": Array [
          Array [
            "⛔️ Missing GITHUB_TOKEN",
          ],
        ],
        "results": Array [
          Object {
            "type": "return",
            "value": undefined,
          },
        ],
      }
    `);
  });

  it('should not trigger on non pull request event name', async () => {
    github.context.eventName = 'commit';
    await run({
      ...defaultRunOptions,
      githubToken: 'github.token',
    });

    expect(core.info).toMatchInlineSnapshot(`
      [MockFunction] {
        "calls": Array [
          Array [
            "⚠️ Not a PR event, passing: commit",
          ],
        ],
        "results": Array [
          Object {
            "type": "return",
            "value": undefined,
          },
        ],
      }
    `);
  });

  it('should skip when auto merge is already enabled on that pull request', async () => {
    github.context.payload.pull_request!.mergeable = false;
    github.context.payload.pull_request!.auto_merge = true;
    await run({
      ...defaultRunOptions,
      githubToken: 'github.token',
    });

    expect(core.info).toMatchInlineSnapshot(`
      [MockFunction] {
        "calls": Array [
          Array [
            "🔀 Mergeable: false - state: clean",
          ],
          Array [
            "⏩ Auto merge already enabled",
          ],
        ],
        "results": Array [
          Object {
            "type": "return",
            "value": undefined,
          },
          Object {
            "type": "return",
            "value": undefined,
          },
        ],
      }
    `);
  });

  it('should skip when the pul request does not have the required labels', async () => {
    github.context.payload.pull_request!.labels = [];
    await run({
      ...defaultRunOptions,
      githubToken: 'github.token',
    });

    expect(core.info).toMatchInlineSnapshot(`
      [MockFunction] {
        "calls": Array [
          Array [
            "🚫 Missing required labels => required: [automerge], found: []",
          ],
        ],
        "results": Array [
          Object {
            "type": "return",
            "value": undefined,
          },
        ],
      }
    `);
  });

  it('should skip when the main branch has no status check defined', async () => {
    (gitHelper.hasStatusCheck as jest.Mock).mockResolvedValue(false);
    await run({
      ...defaultRunOptions,
      githubToken: 'github.token',
    });

    expect(core.info).toMatchInlineSnapshot(`
      [MockFunction] {
        "calls": Array [
          Array [
            "❌ No status check found on the main branch, passing",
          ],
        ],
        "results": Array [
          Object {
            "type": "return",
            "value": undefined,
          },
        ],
      }
    `);
  });

  it('should merge if the pull request is mergeable and on a clean state', async () => {
    (gitHelper.hasStatusCheck as jest.Mock).mockResolvedValue(true);
    await run({
      ...defaultRunOptions,
      githubToken: 'github.token',
    });

    expect(core.info).toMatchInlineSnapshot(`
      [MockFunction] {
        "calls": Array [
          Array [
            "🔀 Mergeable: true - state: clean",
          ],
          Array [
            "🔀 Merging branch",
          ],
        ],
        "results": Array [
          Object {
            "type": "return",
            "value": undefined,
          },
          Object {
            "type": "return",
            "value": undefined,
          },
        ],
      }
    `);
    expect(gitHelper.merge).toHaveBeenCalled();
  });

  it('should enable auto merge when the pull request is not on mergeable or on a clean this.state.', async () => {
    (gitHelper.hasStatusCheck as jest.Mock).mockResolvedValue(true);
    github.context.payload.pull_request!.mergeable = false;
    await run({
      ...defaultRunOptions,
      githubToken: 'github.token',
    });

    expect(core.info).toMatchInlineSnapshot(`
      [MockFunction] {
        "calls": Array [
          Array [
            "🔀 Mergeable: false - state: clean",
          ],
          Array [
            "🔀 Enabling auto merge on the PR #42 (000001)",
          ],
        ],
        "results": Array [
          Object {
            "type": "return",
            "value": undefined,
          },
          Object {
            "type": "return",
            "value": undefined,
          },
        ],
      }
    `);
    expect(gitHelper.enableAutoMerge).toHaveBeenCalled();
  });
});
