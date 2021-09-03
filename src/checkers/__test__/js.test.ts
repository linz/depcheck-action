import { promises as fs } from 'fs';
import o from 'ospec';
import { createSandbox } from 'sinon';
import { javascriptHandler } from '../js';

o.spec('JsHandler', () => {
  const sandbox = createSandbox();
  o.afterEach(() => {
    sandbox.restore();
  });

  o('should support import require', async () => {
    const line = "const ec2 = require('@aws-cdk/aws-ec2')";
    sandbox.stub(fs, 'readFile').resolves(Buffer.from(line));

    const ret = await javascriptHandler('foo.js');
    o(ret[0].path).equals('foo.js');
    o(ret[0].startLine).equals(0);
    o(ret[0].package).equals('@aws-cdk/aws-ec2');
    o(ret[0].import).equals('');
    o(ret[0].line).equals(line);
  });
});
