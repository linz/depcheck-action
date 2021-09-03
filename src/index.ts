import * as core from '@actions/core';
import { ImportChecker } from './import.checker';

export async function main(): Promise<void> {
  const checker = new ImportChecker(core.getInput('package-json'), {
    ignorePackages: new Set(core.getMultilineInput('package-ignore')),
  });
  await checker.check();
}

main().catch((e) => core.setFailed(e.mssage));
