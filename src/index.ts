import * as core from '@actions/core';
import { ImportChecker } from './import.checker';

export async function main(rootPackage: string = core.getInput('package-json')): Promise<void> {
  const checker = new ImportChecker(rootPackage, { ignorePackages: new Set() });
  await checker.check();
}

main().catch((e) => core.setFailed(e.mssage));
