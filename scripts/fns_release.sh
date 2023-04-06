#!/bin/sh

script_dir="$( cd "$( dirname "$0"  )" && pwd  )"
project_dir=$(dirname "$script_dir")

actions_envs() {
  # echo "::set-output name=TARGET_OS::$TARGET_OS"
  export GIT_BRANCH=${GITHUB_REF#refs/heads/}
  # echo "::set-output name=GIT_BRANCH::$GIT_BRANCH"
  export GIT_TAG=$(git tag | grep $(git describe --tags HEAD))
  # echo "::set-output name=GIT_TAG::$GIT_TAG"
  export GIT_COMMIT_HEAD_MSG=$(git log --format=%b -1)
  # echo "::set-output name=GIT_COMMIT_HEAD_MSG::$GIT_COMMIT_HEAD_MSG"
  export GIT_COMMIT_SHORTCUTS=$(git log --format=%h -1)
  # echo "::set-output name=GIT_COMMIT_SHORTCUTS::$GIT_COMMIT_SHORTCUTS"
  export GIT_COMMIT_TIME=$(git show -s --format="%cd" --date=format:%Y%m%d%H%M%S HEAD)
  # echo "::set-output name=GIT_COMMIT_TIME::$GIT_COMMIT_TIME"
}

update_version() {
  # on actions, get tag from env var
  if [ -z $VERSION ]; then
    echo "VERSION is not set"
    exit 1
  fi

  cd $project_dir/ && npm --no-git-tag-version version $VERSION;
  cd $project_dir/release/app && npm --no-git-tag-version version $VERSION && cd $project_dir

  echo ":wq" | git-changelog --all --prune-old --tag v$VERSION;
  echo ""
  echo "[update_version] enforce publish reg release by running 'git-release v$VERSION-reg'"
  echo "[update_version] enforce publish prod release by running 'git-release v$VERSION-prod'"
  echo "[update_version] determine release channel based on CI env variable by running 'git-release v$VERSION'"
  echo ""
}

release_darwin() {
  # by default we package app for `darwin-reg` channel
  # if you want to publish to `darwin-prod` channel, set buildchannel=prod

  echo "[release_darwin] start packaging...";
  export RABBY_NOTARIZE=true
  npm run package:darwin:x64
  npm run package:darwin:arm64
  unset RABBY_NOTARIZE;

  dbk release-desktop --cwd=$project_dir
}

release_win32() {
  # by default we package app for `win32-reg` channel
  # if you want to publish to `win32-prod` channel, set buildchannel=prod

  echo "[release_win32] start packaging...";
  npm run package:win32:x64
  # npm run package:win32:ia32

  dbk release-desktop --cwd=$project_dir
}
