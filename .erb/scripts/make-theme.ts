#!/usr/bin/env ts-node

import fs from 'node:fs';
import path from 'node:path';
import { themeColors } from '../../src/isomorphic/theme-colors';

const ROOT = path.resolve(__dirname, '../..');

const cssvarSrcfile = path.resolve(ROOT, 'src/renderer/css/theme/nextcssvars.css');

const SPACES = `  `;

makeCssVar: {
  const cssvarSrcContent = `
:root {
  /* -------------------- base define -------------------- */
${Object.entries(themeColors.dark).map(([cssvarKey, cssvarValue]) => {
  const varcore = cssvarKey.replace(/^\-\-/, '');
  return `${SPACES}--rabby-dark-${varcore}: ${cssvarValue};`;
}).join('\n')}
}

html, body {
  /* -------------------- default dark mode -------------------- */
${Object.entries(themeColors.dark).map(([cssvarKey]) => {
  const varcore = cssvarKey.replace(/^\-\-/, '');
  return `${SPACES}--${cssvarKey}: var(--rabby-dark-${varcore});`;
}).join('\n')}
}
`;
  fs.writeFileSync(cssvarSrcfile, cssvarSrcContent, 'utf8');
}
