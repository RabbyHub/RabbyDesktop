#!/usr/bin/env sh

VERSION=$(node --eval="process.stdout.write(require('./package.json').version)");

scripts_dir="$( cd "$( dirname "$0"  )" && pwd  )"
project_dir=$(dirname "$script_dir")

# npm run package:darwin:arm64;
if [ -e $project_dir/release/build-darwin-arm64-reg/rabby-wallet-desktop-installer-arm64-${VERSION}.dmg ]; then
  TARGET=$project_dir/release/rabby-wallet-desktop-installer-m1-${VERSION}.dmg
  rm -f $TARGET;

  cp $project_dir/release/build-darwin-arm64-reg/rabby-wallet-desktop-installer-arm64-${VERSION}.dmg $TARGET;
  echo "[rename_dist] got $TARGET";
fi

# npm run package:darwin:x64;
if [ -e $project_dir/release/build-darwin-x64-reg/rabby-wallet-desktop-installer-x64-${VERSION}.dmg ]; then
  TARGET=$project_dir/release/rabby-wallet-desktop-installer-intel-${VERSION}.dmg
  rm -f $TARGET;

  cp $project_dir/release/build-darwin-x64-reg/rabby-wallet-desktop-installer-x64-${VERSION}.dmg $TARGET;
  echo "[rename_dist] got $TARGET";
fi

