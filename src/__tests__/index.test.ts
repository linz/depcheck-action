import * as core from '@actions/core';
import o from 'ospec';
import * as path from 'path';
import { createSandbox } from 'sinon';
import { ImportChecker } from '../import.checker';

const Examples = path.join(__dirname, '..', '..', '..', 'examples');
o.spec('Main', () => {
  const sandbox = createSandbox();
  o.beforeEach(() => {
    sandbox.stub(core, 'setFailed');
  });
  o.afterEach(() => {
    sandbox.restore();
  });

  o('should find package.json', async () => {
    o.timeout(500);
    const errStub = sandbox.stub(core, 'error');

    await new ImportChecker(path.join(Examples, 'missing-dep')).check();

    o(errStub.callCount).equals(2);
    const annotation = errStub.args[0][1] as any;
    o(annotation.title).equals('"aws-sdk" not found in package.json');
    o(annotation.file.endsWith('examples/missing-dep/index.js')).equals(true);
    o(annotation.startLine).equals(0);

    const annotationB = errStub.args[1][1] as any;
    o(annotationB.title).equals('"aws-sdk" not found in package.json');
    o(annotationB.file.endsWith('examples/missing-dep/index.js')).equals(true);
    o(annotationB.startLine).equals(1);
  });

  o('should find find workspaces', async () => {
    o.timeout(500);

    const errStub = sandbox.stub(core, 'error');

    await new ImportChecker(path.join(Examples, 'workspace')).check();

    o(errStub.calledOnce).equals(true);
    const annotation = errStub.args[0][1] as any;
    o(annotation.title).equals('"a" not found in package.json');
    o(annotation.file.endsWith('examples/workspace/packages/b/src/index.ts')).equals(true);
  });
});
