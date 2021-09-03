import { ImportChecker } from './import.checker';

new ImportChecker(process.argv[process.argv.length - 1], {
  ignoreExtensions: new Set(['.js']),
  ignorePackages: new Set([]),
})
  .check()
  .catch(console.error);
