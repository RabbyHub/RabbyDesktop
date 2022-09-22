import chalk from "chalk";

type ChalkKeys = typeof chalk;
type AllFuncKey = { [P in keyof ChalkKeys]: ChalkKeys[P] extends (input: string) => any ? P : never }[keyof ChalkKeys];

export function getBindLog(prefix: string, prefixColor: AllFuncKey, opts?: {
  logColor?: AllFuncKey
}) {
  return (subPreifx: string, log?: any) => {
    if (!log) {
      log = subPreifx;
      subPreifx = '';
    }
    console.debug(
      ...[
        `${chalk.gray('[mainprocess]')} `,
        `${chalk[prefixColor](`[${subPreifx || prefix}]`)} `,
        opts?.logColor ? `${chalk[opts?.logColor](JSON.stringify(log, null, 2))}` : log
      ]
    );
  }
}

export const cLog = getBindLog('cLog', 'blue');
