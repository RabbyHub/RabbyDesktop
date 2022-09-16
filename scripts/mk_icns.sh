#!/usr/bin/env sh

script_dir="$( cd "$( dirname "$0"  )" && pwd  )"
project_dir=$(dirname "$script_dir")

god_file=$project_dir/assets/logo-1024w.png;
iconset_dir=$project_dir/tmp.iconset;

rm -rf $iconset_dir;
mkdir -p $iconset_dir;

sips -z 256 256     $god_file --out $project_dir/assets/icon.png
npm run generate-ico;

sips -z 16 16       $god_file --out $iconset_dir/icon_16x16.png
sips -z 32 32       $god_file --out $iconset_dir/icon_16x16@2x.png
sips -z 32 32       $god_file --out $iconset_dir/icon_32x32.png
sips -z 64 64       $god_file --out $iconset_dir/icon_32x32@2x.png
sips -z 128 128     $god_file --out $iconset_dir/icon_128x128.png
sips -z 256 256     $god_file --out $iconset_dir/icon_128x128@2x.png
sips -z 256 256     $god_file --out $iconset_dir/icon_256x256.png
sips -z 512 512     $god_file --out $iconset_dir/icon_256x256@2x.png
sips -z 512 512     $god_file --out $iconset_dir/icon_512x512.png
sips -z 1024 1024   $god_file --out $iconset_dir/icon_512x512@2x.png

iconutil -c icns $iconset_dir -o $project_dir/assets/icon.icns

rm -rf $iconset_dir;

echo "[mk_icns] success!"
