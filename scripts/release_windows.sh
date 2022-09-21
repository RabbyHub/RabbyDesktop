#!/bin/sh

echo "[release_windows] start packaging...";
npm run package

script_dir="$( cd "$( dirname "$0"  )" && pwd  )"
project_dir=$(dirname "$script_dir")

dbk release-desktop --cwd=$project_dir
