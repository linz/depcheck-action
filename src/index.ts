import { main } from './depcheck';
import * as core from '@actions/core';

main().catch((e) => {
  core.setFailed(e.message);
});
