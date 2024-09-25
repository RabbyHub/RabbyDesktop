import { walletOpenapi } from '@/renderer/ipcRequest/rabbyx';

export type IExtractFromPromise<T> = T extends Promise<infer U> ? U : T;

type IOpenAPIClient = typeof walletOpenapi;
type AllKeysOnOpenAPI = keyof IOpenAPIClient;
type AllMethodNamesOnOpenAPI = {
  [P in AllKeysOnOpenAPI]: Exclude<IOpenAPIClient[P], undefined> extends (
    ...args: any[]
  ) => any
    ? P
    : never;
}[AllKeysOnOpenAPI];

type ResultType<T> = {
  mainnet: T;
};
type IHandleResults<T, R> = (ctx: ResultType<T>) => R extends T ? T : R;
const defaultProcessResults = <T>(ctx: ResultType<T>) => {
  return ctx.mainnet;
};

export async function requestOpenApiMultipleNets<
  T extends
    | IExtractFromPromise<
        ReturnType<Exclude<IOpenAPIClient[AllMethodNamesOnOpenAPI], undefined>>
      >
    | any,
  R = T
>(
  request: (ctx: {
    /**
     * @description openapi instance for every request task
     *
     * one request to mainnet would be always sent, if `options.needTestnetResult`
     * is true, then another request to testnet would be also sent.
     *
     */
    openapi: IOpenAPIClient;
    isTestnetTask?: boolean;
  }) => Promise<T> | T,
  options: {
    fallbackValues: ResultType<T>;
    needTestnetResult?: boolean;
    processResults?: IHandleResults<T, R>;
  }
): Promise<R extends T ? T : R> {
  const {
    processResults = defaultProcessResults as IHandleResults<T, R>,
    fallbackValues,
  } = options || {};

  const mainnetOpenapi = walletOpenapi;

  // if (!needTestnetResult) {
  //   return request({ wallet, openapi: mainnetOpenapi });
  // }

  const mainnetP = request({ openapi: mainnetOpenapi });

  return Promise.allSettled([mainnetP]).then(([mainnet]) => {
    const mainResult =
      mainnet.status === 'fulfilled' ? mainnet.value : fallbackValues.mainnet;

    return processResults({
      mainnet: mainResult,
    });
  });
}

export async function requestOpenApiWithChainId<
  T extends IExtractFromPromise<
    ReturnType<Exclude<IOpenAPIClient[AllMethodNamesOnOpenAPI], undefined>>
  >
>(
  request: (ctx: {
    /**
     * @description final openapi instance, determined by options.isTestnet
     */
    openapi: IOpenAPIClient;
  }) => Promise<T>,
  options: {
    isTestnet?: boolean;
  }
) {
  const mainnetOpenapi = walletOpenapi;

  return request({ openapi: mainnetOpenapi });
}
