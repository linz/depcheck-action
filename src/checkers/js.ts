import { promises as fs } from 'fs';
import { ImportResults } from './handler';
import { parsePackage, QuoteRegex, RequireChunk } from './util';

export async function javascriptHandler(filePath: string): Promise<ImportResults[]> {
  const output: ImportResults[] = [];
  const data = await fs.readFile(filePath);
  const lines = data.toString().split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const requireIndex = line.indexOf(RequireChunk);
    if (requireIndex === -1) continue;
    const req = line
      .substring(requireIndex + RequireChunk.length, line.indexOf(')', requireIndex))
      .replace(QuoteRegex, '');

    const pkg = parsePackage(req);
    if (pkg.package.startsWith('.')) continue;
    // TODO explore these failures
    if (pkg.package === '') continue;

    output.push({
      startLine: i,
      package: pkg.package,
      import: pkg.path,
      startColumn: requireIndex,
      path: filePath,
      line,
    });
  }
  return output;
}
