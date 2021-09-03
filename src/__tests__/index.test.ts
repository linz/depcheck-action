import o from 'ospec';
import * as core from '@actions/core';
import { createSandbox } from 'sinon';
import { main } from '../depcheck';
import * as path from 'path';

const Examples = path.join(__dirname, '..', '..', '..', 'examples');
o.spec('Main', () => {
  const sandbox = createSandbox();
  o.beforeEach(() => {
    sandbox.restore();
  });

  o('should find package.json', async () => {
    o.timeout(500);
    sandbox.stub(core, 'getInput').returns(path.join(Examples, 'missing-dep'));
    const errStub = sandbox.stub(core, 'error');

    await main();

    o(errStub.calledOnce).equals(true);
    const annotation = errStub.args[0][1] as any;
    o(annotation.title).equals('"aws-sdk" not found in package.json');
    o(annotation.file.endsWith('examples/missing-dep/index.js')).equals(true);
  });

  o('should find find workspaces', async () => {
    o.timeout(500);

    sandbox.stub(core, 'getInput').returns(path.join(Examples, 'workspace'));
    const errStub = sandbox.stub(core, 'error');

    await main();

    o(errStub.calledOnce).equals(true);
    const annotation = errStub.args[0][1] as any;
    o(annotation.title).equals('"a" not found in package.json');
    o(annotation.file.endsWith('examples/workspace/packages/b/src/index.ts')).equals(true);
  });
});
