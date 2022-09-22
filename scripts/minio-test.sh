#!/usr/bin/env sh

script_dir="$( cd "$( dirname "$0"  )" && pwd  )"
project_dir=$(dirname "$script_dir")

mkdir -p $project_dir/minio-root/test-update

minio_root=$project_dir/minio-root

# for windows
if [ ! -f $minio_root/minio.exe ]; then
  curl -sL https://dl.min.io/server/minio/release/windows-amd64/minio.exe -o $minio_root/minio.exe
fi

$minio_root/minio server $minio_root

# # windows
# UPDATER_TEST_URL=http://192.168.2.120:9000/test-update ./release/build/win-unpacked/Rabby\ Wallet.exe --inspect
