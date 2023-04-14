const matchLine = /^\s*((\w+) : )?(<\w+>)?\s?(.*)$/;
const matchNumeric = /^\d+(\.\d*)?$/;

/**
 * @description This technique of parsing is fairly naive, but it works pretty well, so eh.
 *
 * @example one possible input
 *
 * <dictionary> {
    ExceptionsList : <array> {
      0 : 192.168.0.0/16
      1 : 10.0.0.0/8
      2 : 172.16.0.0/12
      3 : 127.0.0.1
      4 : localhost
      5 : *.local
      6 : timestamp.apple.com
    }
    HTTPEnable : 1
    HTTPPort : 7890
    HTTPProxy : 127.0.0.1
    HTTPSEnable : 1
    HTTPSPort : 7890
    HTTPSProxy : 127.0.0.1
    SOCKSEnable : 1
    SOCKSPort : 7890
    SOCKSProxy : 127.0.0.1
  }
 *
 */
export function parseScUtilProxyOutput(str: string) {
  const lines = String(str).split('\n');
  const stack: any[] = [];
  type ValueType = string | boolean | number;
  let root: Record<string, ValueType> = {};

  let key: ValueType;
  let type: string;
  let value: ValueType;

  lines.forEach(function (line) {
    const values = line.match(matchLine);
    if (!values) {
      return;
    }

    const parent = stack[stack.length - 1] || {};

    key = values[2];
    type = values[3]?.toLowerCase() || '';
    value = values[4];

    if (parent instanceof Array) {
      key = parseInt(key, 10);
    }

    if (value === '}') {
      if (stack.length === 1) {
        root = stack[0];
      }
      stack.pop();
    } else if (type === '<array>') {
      stack.push((parent[key] = []));
    } else if (type === '<dictionary>') {
      stack.push((parent[key] = {}));
    } else {
      if (value.match(matchNumeric)) {
        value = parseFloat(value);
      }
      parent[key] = value;
    }
  });

  return root;
}
