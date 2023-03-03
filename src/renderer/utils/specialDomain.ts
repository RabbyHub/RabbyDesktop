import { canoicalizeDappUrl } from '@/isomorphic/url';
import Axios from 'axios';
import { isEqual } from 'lodash';

let domains: string[] = [];

const init = async () => {
  // window.rabbyDesktop.ipcRenderer
  //   .invoke('get-app-dynamic-config')
  //   .then((result) => {
  //     if (result.error) {
  //       console.error('[useAppDynamicConfig] error', result.error);
  //       // forwardMessageTo('main-window', 'toast-on-mainwin', {
  //       //   type: 'error',
  //       // })
  //       return;
  //     }
  //     domains = result.dynamicConfig?.special_main_domains?.ids || [];
  //   });
  const { data } = await Axios.get<{ ids: string[] }>(
    `https://api.rabby.io/v1/domain/share_list`
  );
  domains = data?.ids || [];
  console.log(domains);
};

init();

export const isSpecialDomain = (url: string) => {
  const res = canoicalizeDappUrl(url);
  return !!domains.find((domain) => {
    const list = domain.split('.');
    const list1 = res.hostname.split('.');
    return isEqual(list, list1.slice(list1.length - list.length));
  });
};

export const parseDappURL = (url: string) => {
  const res = canoicalizeDappUrl(url);
  console.log(url, domains);
  return {
    ...res,
    isSpecialDomain: !!domains.find((domain) => {
      const list = domain.split('.');
      const list1 = res.hostname.split('.');
      return isEqual(list, list1.slice(list1.length - list.length));
    }),
  };
};
