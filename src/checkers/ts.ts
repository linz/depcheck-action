import { promises as fs } from 'fs';
import { ImportResult } from './handler';
import { parsePackage, QuoteRegex, RequireChunk } from './util';

export async function typescriptHandler(filePath: string): Promise<ImportResult[]> {
  const output: ImportResult[] = [];
  const data = await fs.readFile(filePath);
  const lines = data.toString().split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith('import ')) continue;

    const fromIndex = line.indexOf('from ');
    const requireIndex = line.indexOf(RequireChunk);

    let req = '';
    if (fromIndex !== -1) {
      req = line.substring(fromIndex + 5);
    } else if (requireIndex !== -1) {
      req = line.substring(requireIndex + RequireChunk.length, line.indexOf(')', requireIndex));
    } else {
      req = line.substring('import '.length);
    }
    req = req.replace(QuoteRegex, '').trim();

    const pkg = parsePackage(req);
    if (pkg.package.startsWith('.')) continue;
    // TODO, support multiline imports
    if (pkg.package === '{') continue;

    output.push({
      startLine: i + 1,
      package: pkg.package,
      import: pkg.path,
      startColumn: 0,
      path: filePath,
      line,
    });
  }
  return output;
}
