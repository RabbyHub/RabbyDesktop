import { canoicalizeDappUrl } from '@/isomorphic/url';
import { isEqual } from 'lodash';

export const getSpecialDomain = (url: string, domains: string[]) => {
  const res = canoicalizeDappUrl(
    /^\w+:\/\//.test(url) ? url : `https://${url}`
  );
  return domains.find((domain) => {
    const list = domain.split('.');
    const list1 = res.hostname.split('.');
    return isEqual(list, list1.slice(list1.length - list.length));
  });
};
