import { ImportHandler } from './checkers/handler';
import { javascriptHandler } from './checkers/js';
import { typescriptHandler } from './checkers/ts';

export const Handlers: Record<string, ImportHandler> = {
  '.ts': typescriptHandler,
  '.js': javascriptHandler,
};
