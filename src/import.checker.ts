import * as core from '@actions/core';
import * as glob from '@actions/glob';
import { existsSync, promises as fs } from 'fs';
import ignore, { Ignore } from 'ignore';
import * as path from 'path';
import { Handlers } from './checker';
import { ImportResult } from './checkers/handler';
import { BuiltInNodeModules } from './node.modules';
/**
 * get the package.json location from this path
 * @param pkgPath
 * @returns
 */
function getPackagePath(pkgPath: string): string {
  if (pkgPath.endsWith('package.json')) return pkgPath;
  return path.join(pkgPath, 'package.json');
}

async function loadPackageJson(pkgPath: string): Promise<Record<string, any>> {
  const rootJson = await fs.readFile(getPackagePath(pkgPath));
  return JSON.parse(rootJson.toString());
}

interface ImportCheckerOptions {
  /**
   * Extensions to ignore
   *
   * @default `[]`
   */
  ignoreExtensions: Set<string>;

  /** Packages to ignore @default `[]` */
  ignorePackages: Set<string>;

  /**
   * Should built in node modules be excluded eg `fs` or `crypto`
   * @default true
   */
  isNode: boolean;

  /**
   * Should dev dependencies from the workspace be able to be used in sub packages
   * @default true
   */
  isWorkspace: boolean;
}

const DefaultOptions = {
  ignoreExtensions: new Set<string>(),
  ignorePackages: new Set<string>(),
  isNode: true,
  isWorkspace: true,
};

interface Dependencies {
  dep: Set<string>;
  dev: Set<string>;
}

export class ImportChecker {
  options: ImportCheckerOptions;
  basePath: string;
  base: Dependencies;
  ig: Ignore;
  failures: ImportResult[];
  constructor(basePath: string, options: Partial<ImportCheckerOptions> = {}) {
    this.options = {
      ...DefaultOptions,
      ...options,
    };
    this.basePath = basePath.endsWith('package.json') ? path.dirname(basePath) : basePath;
    this.ig = ignore();
  }

  async check(): Promise<void> {
    this.failures = [];
    this.loadIgnore(path.join(this.basePath, '.gitignore'));
    this.loadIgnore(path.join(this.basePath, '.depignore'));

    const pkg = await loadPackageJson(this.basePath);
    this.base = {
      dev: new Set(Object.keys(pkg.devDependencies ?? {})),
      dep: new Set(Object.keys(pkg.dependencies ?? {})),
    };

    if (pkg.workspaces == null) await this.checkPackage(this.basePath);
    else if (Array.isArray(pkg.workspaces)) await this.checkPackages(pkg.workspaces);
    else if (Array.isArray(pkg.workspaces['packages'])) await this.checkPackages(pkg.workspaces.packages);
    else {
      core.error('Unknown workspace');
    }

    if (this.failures.length > 0) core.setFailed('Missing dependencies');
  }

  /** Load ignore files eg .gitignore */
  async loadIgnore(ignorePath: string): Promise<void> {
    try {
      const data = await fs.readFile(ignorePath);
      this.ig.add(data.toString());
    } catch (e) {
      return;
    }
  }

  /**
   * Validate all packages inside a glob string
   * @example ["packages/*"]
   */
  async checkPackages(packages: string[]): Promise<void> {
    for (const workspaceDir of packages) {
      const globber = await glob.create(path.join(this.basePath, workspaceDir), { implicitDescendants: false });
      for await (const subPackage of globber.globGenerator()) {
        await this.checkPackage(subPackage);
      }
    }
  }

  /** check a individual package to see if there are any unlinked dependencies */
  async checkPackage(pkgPath: string): Promise<void> {
    if (!existsSync(getPackagePath(pkgPath))) {
      core.debug(`Skipping path: "${pkgPath}" - No package.json found`);
      return;
    }
    core.info(`Checking package: "${pkgPath}"`);

    const pkg = await loadPackageJson(pkgPath);
    const res = await this.getAllImports(pkgPath);

    const devDeps = new Set(Object.keys(pkg.devDependencies ?? {}));
    const deps = new Set(Object.keys(pkg.dependencies ?? {}));

    const unusedDeps = new Set(...deps);

    for (const dep of res.packages) unusedDeps.delete(dep);

    const seen = new Map<string, number>();

    for (const dep of res.imports) {
      if (deps.has(dep.package)) continue;
      if (devDeps.has(dep.package)) continue;
      /** Ignored */
      if (this.options.ignorePackages.has(dep.package)) continue;
      /** Check if its a standard node package */
      if (this.options.isNode && BuiltInNodeModules.has(dep.package)) continue;
      /** Check if it exists in the workspace's dependencies */
      if (this.options.isWorkspace && this.base.dev.has(dep.package)) continue;

      // Only log a error upto 5 times per file
      const packageKey = [dep.package, dep.path].join('::');
      const currentValue = seen.get(packageKey) ?? 0;
      seen.set(packageKey, currentValue + 1);
      if (currentValue >= 5) continue;

      this.failures.push(dep);
      core.error(`Missing Package: "${dep.package}" is missing in ${dep.path}`, {
        startLine: dep.startLine,
        startColumn: dep.startColumn,
        title: `"${dep.package}" not found in package.json`,
        // Work around for https://github.com/actions/toolkit/issues/892
        file: dep.path,
      } as any);
    }
  }

  /** Create a collection of all imports and where they are found in the files  */
  async getAllImports(importPath: string): Promise<{ imports: ImportResult[]; packages: Set<string> }> {
    const imports: ImportResult[] = [];
    const packages = new Set<string>();

    for await (const filePath of this.listFolder(importPath)) {
      if (this.isIgnored(filePath)) continue;

      const ext = path.extname(filePath);
      if (this.options.ignoreExtensions.has(ext)) continue;
      if (Handlers[ext] == null) continue;
      const res = await Handlers[ext](filePath);
      if (res.length === 0) continue;
      for (const r of res) {
        imports.push(r);
        packages.add(r.package);
      }
    }
    return { imports, packages };
  }

  /** Recursively list a folder while ignoring any ignored folders @see isIgnored */
  async *listFolder(folder: string): AsyncGenerator<string> {
    const files = await fs.readdir(folder, { withFileTypes: true });
    for (const file of files) {
      const newPath = path.join(folder, file.name);
      if (this.isIgnored(folder)) continue;
      if (file.isDirectory()) yield* this.listFolder(newPath);
      else yield newPath;
    }
  }

  /** Is a file path ignored for any reason
   * @see this.loadIgnore
   * @see ImportCheckerOptions
   */
  isIgnored(filePath: string): boolean {
    const relPath = filePath.substr(this.basePath.length + 1);
    if (relPath.length === 0) return false;
    if (this.ig.ignores(relPath)) return true;
    return false;
  }
}
