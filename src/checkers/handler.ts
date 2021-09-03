export interface ImportResults {
  startLine: number;
  startColumn: number;
  line: string;
  package: string;
  import: string;
  path: string;
}

export interface ImportHandler {
  (path: string): Promise<ImportResults[]>;
}
