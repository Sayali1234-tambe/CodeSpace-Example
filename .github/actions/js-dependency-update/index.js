const core = require('@actions/core');
const exec = require('@actions/exec');
const github = require('@actions/github');

const validateBranchName = (branchName) =>
  /^[a-zA-Z0-9_\-\.\/]+$/.test(branchName);

const validateDirectoryName = (dirName) =>
  /^[a-zA-Z0-9_\-\/\.]+$/.test(dirName);

async function run() {
  try {
    const baseBranch = core.getInput('base-branch', { required: true });
    const targetBranch = core.getInput('target-branch', { required: true });
    const ghToken = core.getInput('gh-token', { required: true });
    const workingDir = core.getInput('working-directory', { required: true });
    const debug = core.getBooleanInput('debug');

    const commonExecOpts = { cwd: workingDir };

    core.setSecret(ghToken);

    // ✅ Validate inputs
    if (!validateBranchName(baseBranch)) {
      throw new Error('Invalid base branch name');
    }

    if (!validateBranchName(targetBranch)) {
      throw new Error('Invalid target branch name');
    }

    if (!validateDirectoryName(workingDir)) {
      throw new Error('Invalid working directory');
    }

    core.info(`[js-dependency-update] base branch: ${baseBranch}`);
    core.info(`[js-dependency-update] target branch: ${targetBranch}`);
    core.info(`[js-dependency-update] working dir: ${workingDir}`);

    // ✅ Ensure correct base branch
    await exec.exec(`git checkout ${baseBranch}`, [], commonExecOpts);
    await exec.exec(`git pull origin ${baseBranch}`, [], commonExecOpts);

    // ✅ Install & update dependencies
    await exec.exec('npm install', [], commonExecOpts);
    await exec.exec('npm update', [], commonExecOpts);

    // ✅ Check for changes
    const gitStatus = await exec.getExecOutput(
      'git status -s package*.json',
      [],
      commonExecOpts
    );

    if (debug) {
      core.info(`[DEBUG] git status:\n${gitStatus.stdout}`);
    }

    if (!gitStatus.stdout.trim()) {
      core.info('[js-dependency-update] No updates found.');
      return;
    }

    core.info('[js-dependency-update] Updates detected.');

    // ✅ Configure git
    await exec.exec(`git config user.name "gh-automation"`);
    await exec.exec(`git config user.email "gh-automation@email.com"`);

    // ✅ Auth for push
    const { owner, repo } = github.context.repo;
    await exec.exec(
      `git remote set-url origin https://x-access-token:${ghToken}@github.com/${owner}/${repo}.git`
    );

    // ✅ Create or reset branch
    await exec.exec(`git checkout -B ${targetBranch}`, [], commonExecOpts);

    // ✅ Commit changes
    await exec.exec(`git add package*.json`, [], commonExecOpts);
    await exec.exec(
      `git commit -m "chore: update dependencies"`,
      [],
      commonExecOpts
    );

    // ✅ Push branch
    await exec.exec(
      `git push origin ${targetBranch} --force`,
      [],
      commonExecOpts
    );

    // ✅ Create PR
    const octokit = github.getOctokit(ghToken);

    try {
      await octokit.rest.pulls.create({
        owner,
        repo,
        title: 'Update NPM dependencies',
        body: 'This PR updates NPM dependencies automatically.',
        base: baseBranch,
        head: targetBranch,
      });

      core.info('[js-dependency-update] PR created successfully.');
    } catch (e) {
      if (e.status === 422) {
        core.info('[js-dependency-update] PR already exists.');
      } else {
        throw e;
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();