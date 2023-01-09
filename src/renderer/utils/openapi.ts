import { OpenApiService } from '@debank/rabby-api';

export const INITIAL_OPENAPI_URL = 'https://api.rabby.io';

const openApi = new OpenApiService({
  store: {
    host: INITIAL_OPENAPI_URL,
  },
});

export default openApi;
