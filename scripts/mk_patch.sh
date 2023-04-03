#!/usr/bin/env sh
node_modules/.bin/patch-package \
 @ipld/car \
 ipfs-unixfs-exporter \
 --exclude 'nothing'

rm -rf src/main/vendors/multiformats;
mkdir -p src/main/vendors/multiformats;
cp -r node_modules/multiformats/src ./src/main/vendors/multiformats/src
cp -r node_modules/multiformats/vendor ./src/main/vendors/multiformats/vendor
