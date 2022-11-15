#!/usr/bin/env sh

scripts_dir="$( cd "$( dirname "$0"  )" && pwd  )"
assets_dir="$( dirname "$scripts_dir"  )/assets"

# storage-area-explorer
# aws s3 cp ~/Downloads/storage-area-explorer.zip s3://${BUCKET}/rabby/_tools/storage-area-explorer.zip  --acl public-read

echo "[install_exts] try to download storage-area-explorer plugin zip..."
curl -sL https://download.rabby.io/_tools/storage-area-explorer.zip > $assets_dir/storage-area-explorer.zip

mkdir -p $assets_dir/chrome_exts/
echo "[install_exts] clean old plugin..."
rm -rf $assets_dir/chrome_exts/storage-area-explorer;
unzip $assets_dir/storage-area-explorer.zip -d $assets_dir/chrome_exts/storage-area-explorer
# mv $assets_dir/chrome_exts/storage-area-explorer-0.4.1 $assets_dir/chrome_exts/storage-area-explorer

echo "[install_exts] clean..."
rm -f $assets_dir/storage-area-explorer.zip;

echo "[install_exts] finished!"
