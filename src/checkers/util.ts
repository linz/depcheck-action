export function parsePackage(pkg: string): { package: string; path: string } {
  if (pkg.startsWith('@')) {
    const parts = pkg.split('/');
    return { package: parts[0] + '/' + parts[1], path: parts.slice(2).join('/') };
  }

  const parts = pkg.split('/');
  return { package: parts[0], path: parts.slice(1).join('/') };
}

export const QuoteRegex = /['";]*/g;

export const RequireChunk = 'require(';
