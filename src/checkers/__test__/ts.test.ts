import o from 'ospec';
import { createSandbox } from 'sinon';
import { promises as fs } from 'fs';
import { typescriptHandler } from '../ts';

o.spec('TypeScriptHandler', () => {
  const sandbox = createSandbox();
  o.afterEach(() => {
    sandbox.restore();
  });

  o('should handle simple packages', async () => {
    const line = 'import * as aws from "aws-sdk";';
    sandbox.stub(fs, 'readFile').resolves(Buffer.from(line));

    const ret = await typescriptHandler('foo.ts');

    o(ret.length).equals(1);
    o(ret[0].path).equals('foo.ts');
    o(ret[0].startLine).equals(1);
    o(ret[0].startColumn).equals(0);
    o(ret[0].package).equals('aws-sdk');
    o(ret[0].import).equals('');
    o(ret[0].line).equals(line);
  });

  o('should handle simple namespaced packages ', async () => {
    const line = 'import * as aws from "@aws-cdk/aws-s3";';
    sandbox.stub(fs, 'readFile').resolves(Buffer.from(line));

    const ret = await typescriptHandler('foo.ts');

    o(ret.length).equals(1);
    o(ret[0].path).equals('foo.ts');
    o(ret[0].startLine).equals(1);
    o(ret[0].startColumn).equals(0);
    o(ret[0].package).equals('@aws-cdk/aws-s3');
    o(ret[0].import).equals('');
    o(ret[0].line).equals(line);
  });

  o('should handle simple sub packages ', async () => {
    const line = 'import s3 from "aws-sdk/clients/s3";';
    sandbox.stub(fs, 'readFile').resolves(Buffer.from(line));

    const ret = await typescriptHandler('foo.ts');

    o(ret.length).equals(1);
    o(ret[0].path).equals('foo.ts');
    o(ret[0].startLine).equals(1);
    o(ret[0].startColumn).equals(0);
    o(ret[0].package).equals('aws-sdk');
    o(ret[0].import).equals('clients/s3');
    o(ret[0].line).equals(line);
  });

  o('should handle simple direct imports ', async () => {
    const line = "import 'source-map-support/register';";
    sandbox.stub(fs, 'readFile').resolves(Buffer.from(line));

    const ret = await typescriptHandler('foo.ts');

    o(ret.length).equals(1);
    o(ret[0].path).equals('foo.ts');
    o(ret[0].startLine).equals(1);
    o(ret[0].startColumn).equals(0);
    o(ret[0].package).equals('source-map-support');
    o(ret[0].import).equals('register');
    o(ret[0].line).equals(line);
  });

  o('should skip relative imports', async () => {
    const line = "import '../bar';";
    sandbox.stub(fs, 'readFile').resolves(Buffer.from(line));

    const ret = await typescriptHandler('foo.ts');
    o(ret.length).equals(0);
  });

  o('should support import require', async () => {
    const line = "import ec2 = require('@aws-cdk/aws-ec2')";
    sandbox.stub(fs, 'readFile').resolves(Buffer.from(line));

    const ret = await typescriptHandler('foo.ts');
    o(ret[0].path).equals('foo.ts');
    o(ret[0].startLine).equals(1);
    o(ret[0].startColumn).equals(0);
    o(ret[0].package).equals('@aws-cdk/aws-ec2');
    o(ret[0].import).equals('');
    o(ret[0].line).equals(line);
  });
});
