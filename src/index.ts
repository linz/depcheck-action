import * as core from '@actions/core';
// import * as github from '@actions/github';

async function main(): Promise<void> {
  const packageJson = core.getInput('package_json');
  console.log(`Hello ${packageJson}!`);
}

main().catch((e) => {
  core.setFailed(e.message);
});
