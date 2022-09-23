#!/bin/sh

# by default we package app for `win32-reg` channel
# if you want to publish to `win32-prod` channel, set buildchannel=prod

echo "[release_windows] start packaging...";
npm run package:win32:x64
# npm run package:win32:ia32

script_dir="$( cd "$( dirname "$0"  )" && pwd  )"
project_dir=$(dirname "$script_dir")

dbk release-desktop --cwd=$project_dir
