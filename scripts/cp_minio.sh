#!/usr/bin/env sh

script_dir="$( cd "$( dirname "$0"  )" && pwd  )"
project_dir=$(dirname "$script_dir")

rm -rf $project_dir/minio-root/test-update/;
mkdir -p $project_dir/minio-root/test-update/;

# for windows
cp $project_dir/release/build/latest.yml $project_dir/minio-root/test-update/latest.yml
cp $project_dir/release/build/*.exe $project_dir/minio-root/test-update/
cp $project_dir/release/build/*.exe.blockmap $project_dir/minio-root/test-update/
