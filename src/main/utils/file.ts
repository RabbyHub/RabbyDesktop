import fs from 'fs';
import path from 'path';
import os from 'os';

// const IPFS_FILTER_REGEXP = /<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]*)"/gi;
export function filterHtmlForIpfs(htmlStr: string) {
  let shouldReplaced = false;
  // TODO: maybe you should use cheerio to parse html
  if (
    htmlStr.includes(`http-equiv="Content-Security-Policy"`) &&
    htmlStr.includes('upgrade-insecure-requests')
  ) {
    shouldReplaced = true;
    htmlStr = htmlStr.replace(/(^|;)upgrade-insecure-requests(;|$)/g, '$1$2');
  }

  return {
    shouldReplaced,
    resultHtmlStr: htmlStr,
  };
}

export function rewriteIpfsHtmlFile(inputFilePath: string) {
  // Read input file
  const htmlStr = fs.readFileSync(inputFilePath, 'utf8');
  // Filter HTML
  const { resultHtmlStr, shouldReplaced } = filterHtmlForIpfs(htmlStr);

  if (!shouldReplaced) return inputFilePath;

  // Write to random temp file
  const randomFilename = Math.random().toString(36).substring(7);
  const tmpDir = os.tmpdir();
  const tmpFilePath = path.join(tmpDir, `${randomFilename}.html`);
  fs.writeFileSync(tmpFilePath, resultHtmlStr);
  return tmpFilePath;
}
