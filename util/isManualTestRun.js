import { pathToFileURL } from 'node:url';

export default function isManualTestRun(importMetaUrl) {
  return importMetaUrl === pathToFileURL(process.argv[1]).href;
}
