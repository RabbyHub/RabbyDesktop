import { net } from 'electron'
import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { integrateQueryToUrl } from '../../isomorphic/url';

/**
 * @from axios/lib/core/settle
 */
function settle(resolve: any, reject: any, response: AxiosResponse) {
  const validateStatus = response.config.validateStatus;
  if (!response.status || !validateStatus || validateStatus(response.status)) {
    resolve(response);
  } else {
    reject(new AxiosError(
      'Request failed with status code ' + response.status,
      [AxiosError.ERR_BAD_REQUEST, AxiosError.ERR_BAD_RESPONSE][Math.floor(response.status / 100) - 4],
      response.config,
      response.request,
      response
    ));
  }
}

function trimLeft(str: string, symbol: string){
  while(str.startsWith(symbol)) str = str.slice(1);
  return str
}

function trimRight(str: string, symbol: string){
  while(str.endsWith(symbol)) str = str.slice(0, str.length - 1);
  return str
}

/**
 * The Electron Adapter, creates with axios config
 * Usage:
 * @code AxiosStatic.defaults.adapter = ElectronAdapter
 */
// TODO: add test about it and publish as standalone package
export async function AxiosElectronAdapter (config: AxiosRequestConfig) {
  return Promise.race([
    new Promise<any>((resolve, reject) => {
      const method = config.method?.toUpperCase() || 'GET';

      let baseUrl = config.baseURL? config.baseURL : '';
      let configUrl = config.url ? config.url : '';

      baseUrl = trimRight(baseUrl, '/');
      configUrl = trimLeft(configUrl, '/');
      let fullUrl = `${baseUrl}/${configUrl}`;

      if (method === 'GET' && config.params) {
        fullUrl = integrateQueryToUrl(fullUrl, config.params);
      }

      const clientReq = net.request({
        method: config.method,
        url: fullUrl,
        redirect: 'follow'
      });

      if (config.headers){
        for (const key in config.headers){
          if (config.headers.hasOwnProperty(key))
            clientReq.setHeader(key, config.headers[key] as string)
        }
      }

      clientReq
        .on("response", response => {
          response
            .on('data', chunk => {
              const contentType = response.headers['Content-Type'] || response.headers['content-type'] || 'application/json; charset=utf-8';
              const data = (contentType.indexOf('application/json') !== -1) ?
                JSON.parse(chunk.toString('utf8')) : chunk.toString();
              const axiosResp = {
                status: response.statusCode,
                headers: response.headers as AxiosResponse['headers'],
                config: config,
                request: clientReq,
                statusText: response.statusMessage,
                data: data,
              };
              settle(resolve, reject, axiosResp)
            })
            .on('error', () => {
              reject(new AxiosError('Network Error', undefined, config, clientReq))
            })
            .on('aborted', () => {
              reject(new AxiosError('Request aborted', 'undefined', config, clientReq));
            })
        })
        .on('error', error => {
          reject(new AxiosError(`Network Error : ${error.message}`, undefined, config, clientReq));
        })
        .end(config.data, 'utf8')
    }),
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new AxiosError('Timeout', 'timeout'))
      }, config.timeout? config.timeout : 2000)
    })
  ])
};
