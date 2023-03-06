import { canoicalizeDappUrl } from '@/isomorphic/url';

export const query2obj = (str: string) => {
  const res: Record<string, string> = {};
  str.replace(/([^=?#&]*)=([^?#&]*)/g, (_, $1: string, $2: string) => {
    res[decodeURIComponent($1)] = decodeURIComponent($2);
    return '';
  });
  return res;
};

export const obj2query = (obj: Record<string, string>) => {
  return Object.keys(obj)
    .map((key) => {
      return `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`;
    })
    .join('&');
};

export const isValidateUrl = (url: string) => {
  return /^((https|http)?:\/\/)[^\s]+\.[^\s]+/.test(url);
};

export const isSameOrigin = (a: string, b: string) => {
  const { origin: originA } = canoicalizeDappUrl(a);
  const { origin: originB } = canoicalizeDappUrl(b);

  return originA === originB;
};

export const isSameDomain = (a: string, b: string) => {
  const { secondaryDomain: domainA } = canoicalizeDappUrl(a);
  const { secondaryDomain: domainB } = canoicalizeDappUrl(b);

  return domainA === domainB;
};

// 粗略地判断输入字符串是否为一个 domain
export const isDomainLikeStr = (str: string) => {
  return str.split('.').length > 1;
};
