#!/bin/sh

echo "[release_macos] start packaging...";
export CI=true
npm run package
unset CI;

script_dir="$( cd "$( dirname "$0"  )" && pwd  )"
project_dir=$(dirname "$script_dir")

dbk release-desktop --cwd=$project_dir
