import { customAlphabet, nanoid } from 'nanoid';

const ANALYTICS_PATH = 'https://matomo.debank.com/matomo.php';

async function postData(url = '', params: URLSearchParams) {
  const response = await fetch(`${url}?${params.toString()}`, {
    method: 'POST',
  });

  return response;
}

let desktopVersion = '';
async function getDesktopVersion() {
  if (!desktopVersion) {
    const { version } = await window.rabbyDesktop.ipcRenderer.invoke(
      'get-app-version'
    );
    desktopVersion = version;
  }

  return desktopVersion;
}

let userId = '';
const getUserId = async () => {
  if (!userId) {
    const { userId: id } = await window.rabbyDesktop.ipcRenderer.invoke(
      'get-rabbyx-info'
    );
    userId = id || '';
  }

  return userId;
};

const getParams = async () => {
  const gaParams = new URLSearchParams();

  const pathname = window.location.hash.substring(2) || '';
  const url = `https://${window.location.host}.com/${pathname}`;

  gaParams.append('action_name', pathname);
  gaParams.append('idsite', '4');
  gaParams.append('rec', '1');
  gaParams.append('url', encodeURI(url));
  gaParams.append('_id', await getUserId());
  gaParams.append('rand', nanoid());
  gaParams.append('ca', '1');
  gaParams.append('h', new Date().getUTCHours().toString());
  gaParams.append('m', new Date().getUTCMinutes().toString());
  gaParams.append('s', new Date().getUTCSeconds().toString());
  gaParams.append('cookie', '0');
  gaParams.append('send_image', '0');
  gaParams.append('dimension1', await getDesktopVersion());

  return gaParams;
};

export const matomoRequestEvent = async (data: {
  category: string;
  action: string;
  label?: string;
  value?: number;
  transport?: any;
}) => {
  const params = await getParams();

  if (data.category) {
    params.append('e_c', data.category);
  }

  if (data.action) {
    params.append('e_a', data.action);
  }

  if (data.label) {
    params.append('e_n', data.label);
  }

  if (data.value) {
    params.append('e_v', data.value.toString());
  }

  if (data.transport) {
    params.append('e_i', data.transport);
  }

  return postData(ANALYTICS_PATH, params);
};
