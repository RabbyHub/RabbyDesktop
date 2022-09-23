#!/bin/sh

# by default we package app for `darwin-reg` channel
# if you want to publish to `darwin-prod` channel, set buildchannel=prod

echo "[release_macos] start packaging...";
export CI=true
npm run package:darwin:x64
npm run package:darwin:arm64
unset CI;

script_dir="$( cd "$( dirname "$0"  )" && pwd  )"
project_dir=$(dirname "$script_dir")

dbk release-desktop --cwd=$project_dir
