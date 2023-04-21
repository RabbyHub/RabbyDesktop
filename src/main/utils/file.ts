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

export const enum CheckResultType {
  NOT_EXIST = 0,
  NOT_DIRECTORY = 1,
  NO_INDEXHTML = 2,
}
export function checkDappEntryDirectory(
  entryPath: string,
  opts?: {
    checkIndexHtml?: boolean;
  }
) {
  const checkResult = {
    error: null as CheckResultType | null,
  };

  const indexHtmlAbsPath = path.join(entryPath, './index.html');
  if (!entryPath || !fs.existsSync(entryPath)) {
    checkResult.error = CheckResultType.NOT_EXIST;
  } else if (!fs.statSync(entryPath).isDirectory()) {
    checkResult.error = CheckResultType.NOT_DIRECTORY;
  } else if (opts?.checkIndexHtml && !fs.existsSync(indexHtmlAbsPath)) {
    checkResult.error = CheckResultType.NO_INDEXHTML;
  }

  return checkResult;
}
