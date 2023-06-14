import crypto from 'crypto';

export class Signer {
  private secret: string;

  constructor(secretKey: string) {
    this.secret = secretKey;
  }

  sign(
    path: string,
    params: Record<string, string> | string = '',
    method = 'GET'
  ) {
    // params = _.chain(params).toPairs().filter(p => p[1] !== undefined && p[1] !== null).sortBy(0).fromPairs().value();

    const hmac = crypto.createHmac('sha256', this.secret);
    const ts = new Date().toISOString();
    return [
      ts,
      hmac
        .update(`${ts}${method}${path}${params && JSON.stringify(params)}`)
        .digest('base64'),
    ];
  }
}
