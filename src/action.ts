import * as core from '@actions/core';
import { ImportChecker } from './import.checker';

export async function main(): Promise<void> {
  const ignorePackages = new Set((core.getInput('package-ignore') ?? '').split(',').map((c) => c.trim()));
  const checker = new ImportChecker(core.getInput('package-json'), { ignorePackages });
  await checker.check();
}

main().catch((e) => core.setFailed(e.mssage));
