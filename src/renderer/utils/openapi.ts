import {
  INITIAL_OPENAPI_URL,
  INITIAL_TESTNET_OPENAPI_URL,
} from '@/renderer/utils/constant';
import { OpenApiService } from '@rabby-wallet/rabby-api';
import { WebSignApiPlugin } from '@rabby-wallet/rabby-api/dist/plugins/web-sign';

export * from '@rabby-wallet/rabby-api/dist/types';

const service = new OpenApiService({
  plugin: WebSignApiPlugin,
  store: {
    host: INITIAL_OPENAPI_URL,
    testnetHost: INITIAL_TESTNET_OPENAPI_URL,
  },
});

export const testnetOpenapiService = new OpenApiService({
  plugin: WebSignApiPlugin,
  store: {
    host: INITIAL_TESTNET_OPENAPI_URL,
    testnetHost: INITIAL_TESTNET_OPENAPI_URL,
  },
});

export default service;
