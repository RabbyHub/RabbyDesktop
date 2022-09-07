#!/usr/bin/env sh

scripts_dir="$( cd "$( dirname "$0"  )" && pwd  )"
assets_dir="$( dirname "$scripts_dir"  )/assets"

if [ -z $RABBY_VER ]; then
  RABBY_VER=0.45.0
fi

echo "[install_rabby] try to download rabby plugin zip..."
curl -sL https://github.com/RabbyHub/Rabby/releases/download/v${RABBY_VER}/Rabby_v${RABBY_VER}.zip > $assets_dir/rabby_v${RABBY_VER}.zip

mkdir -p $assets_dir/chrome_plugins/
echo "[install_rabby] clean old rabby plugin..."
rm -rf $assets_dir/chrome_plugins/rabby_v${RABBY_VER};
unzip $assets_dir/rabby_v${RABBY_VER}.zip -d $assets_dir/chrome_plugins/rabby_v${RABBY_VER}

echo "[install_rabby] clean..."
rm -f $assets_dir/rabby_v${RABBY_VER}.zip;

echo "[install_rabby] finished!"