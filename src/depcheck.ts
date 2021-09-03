import * as core from '@actions/core';
import { readFile } from 'fs/promises';
import * as path from 'path';
import depcheck from 'depcheck';
import * as glob from '@actions/glob';
import { existsSync } from 'fs';
import * as c from 'ansi-colors';
/**
 * get the package.json location from this path
 * @param pkgPath
 * @returns
 */
function getPackagePath(pkgPath: string): string {
  if (pkgPath.endsWith('package.json')) return pkgPath;
  return path.join(pkgPath, 'package.json');
}

async function loadPackageJson(pkgPath: string): Promise<Record<string, unknown>> {
  const rootJson = await readFile(getPackagePath(pkgPath));
  return JSON.parse(rootJson.toString());
}

export async function main(): Promise<void> {
  const packagePath = core.getInput('package-json');

  const root = await loadPackageJson(packagePath);
  if (root.workspaces == null) await depCheck(packagePath);
  else if (Array.isArray(root.workspaces)) {
    const pathDir = packagePath.endsWith('package.json') ? path.dirname(packagePath) : packagePath;
    for (const workspaceDir of root.workspaces) {
      const globber = await glob.create(path.join(pathDir, workspaceDir), { implicitDescendants: false });
      for await (const subPackage of globber.globGenerator()) {
        await depCheck(subPackage);
      }
    }
  } else {
    core.error('Unknown workspace');
  }
}

async function depCheck(path: string): Promise<void> {
  if (!existsSync(getPackagePath(path))) {
    core.debug(`Skipping path: "${path}" - No package.json found`);
    return;
  }
  core.info(`Checking package: "${path}"`);
  const res = await depcheck(path, {});

  const missing = Object.keys(res.missing);
  if (missing.length === 0) return;

  for (const key of missing) {
    const files = res.missing[key];
    for (const file of files) {
      core.error(c.red('Missing Package: ') + `"${key}" is missing in ${files}`, {
        title: `"${key}" not found in package.json`,
        // Work around for https://github.com/actions/toolkit/issues/892
        file: file,
      } as any);
    }
  }
}
