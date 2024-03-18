#!/usr/bin/env sh

scripts_dir="$( cd "$( dirname "$0"  )" && pwd  )"
project_dir=$(dirname "$script_dir")
assets_dir="$( dirname "$scripts_dir"  )/assets"

echo "[install_rabbyx] try to download rabbyx.zip..."
curl -sL https://download.rabby.io/_tools/RabbyX-v0.92.55-47bdcde.zip > $assets_dir/rabbyx.zip
# curl -sL https://download.rabby.io/_tools/RabbyX-latest.zip > $assets_dir/rabbyx.zip

mkdir -p $assets_dir/chrome_exts/
echo "[install_rabbyx] clean old plugin..."
rm -rf $assets_dir/chrome_exts/rabby;
unzip $assets_dir/rabbyx.zip -d $assets_dir/chrome_exts/rabby/

echo "[install_rabbyx] clean..."
rm -f $assets_dir/rabbyx.zip;

echo "[install_rabbyx] finished!"
