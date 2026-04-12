const core = require('@actions/core');
const exec = require('@actions/exec');
const github = require('@actions/github');

const setupGit = async () => {
  await exec.exec(`git config user.name "github-actions[bot]"`);
  await exec.exec(`git config user.email "github-actions[bot]@users.noreply.github.com"`);
};
const validateBranchName = (branchName) =>
  /^[a-zA-Z0-9_\-\.\/]+$/.test(branchName);

const validateDirectoryName = (dirName) =>
  /^[a-zA-Z0-9_\-\/\.]+$/.test(dirName);

async function run() {
  try {
    const baseBranch = core.getInput('base-branch', { required: true });
    const headBranch = core.getInput('head-branch', { required: true }) ;
    const ghToken = core.getInput('gh-token', { required: true });
    const workingDir = core.getInput('working-directory', { required: true });
    const debug = core.getBooleanInput('debug');

    const commonExecOpts = { cwd: workingDir };

    core.setSecret(ghToken);

    // ✅ Validate inputs
    if (!validateBranchName(baseBranch)) {
      throw new Error('Invalid base branch name');
    }

    if (!validateBranchName(headBranch)) {
      throw new Error('Invalid head branch name');
    }

    if (!validateDirectoryName(workingDir)) {
      throw new Error('Invalid working directory');
    }

    core.info(`[js-dependency-update] base branch: ${baseBranch}`);
    core.info(`[js-dependency-update] head branch: ${headBranch}`);
    core.info(`[js-dependency-update] working dir: ${workingDir}`);

    // ✅ Ensure correct base branch
    await exec.exec(`git checkout ${baseBranch}`, [], commonExecOpts);
    await exec.exec(`git pull origin ${baseBranch}`, [], commonExecOpts);

    // ✅ Update dependencies
    await exec.exec(`npm install`, [], commonExecOpts);
    await exec.exec(`npm update`, [], commonExecOpts);

    let updatesAvailable = false;
    // ✅ Check for changes
    const gitStatus = await exec.getExecOutput(
      updatesAvailable = true,
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
    await setupGit();

    // ✅ Setup authenticated remote
    const { owner, repo } = github.context.repo;
    await exec.exec(
      `git remote set-url origin https://x-access-token:${ghToken}@github.com/${owner}/${repo}.git`
    );

    // ✅ Create/reset branch safely
    await exec.exec(`git checkout -B ${headBranch}`, [], commonExecOpts);

    // ✅ Commit changes
    await exec.exec(`git add package*.json`, [], commonExecOpts);
    await exec.exec(
      `git commit -m "chore: update dependencies"`,
      [],
      commonExecOpts
    );

    // ✅ Push branch
    await exec.exec(
      `git push origin ${headBranch} --force`,
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
        head: headBranch,
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
  logger.debug("Setting output 'updates-available' to true since changes were detected.");
  core.setOutput('updates-available', 'true');
}

run();