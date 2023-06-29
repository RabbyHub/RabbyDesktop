#/usr/bin/env sh

./node_modules/.bin/patch-package \
  @debank/common \
  @rabby-wallet/rabby-swap \
  @rabby-wallet/rabby-api \
  --exclude 'nothing'
