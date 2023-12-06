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

  echo ":wq" | git-changelog -s v0.22.0-prod --prune-old --tag v$VERSION;
  echo ""
  echo "[update_version] enforce publish reg release by running 'git-release v$VERSION-reg'"
  echo "[update_version] enforce publish prod release by running 'git-release v$VERSION-prod'"
  echo "[update_version] determine release channel based on CI env variable by running 'git-release v$VERSION'"
  echo ""
}

pub_changelog() {
  case ${buildchannel} in
      prod) changelog_dir=cdn-config
          ;;
      reg|*) changelog_dir=cdn-config-pre
          ;;
  esac

  cd $project_dir;
  proj_version=$(node --eval="process.stdout.write(require('./package.json').version)");

  src_markdown=$project_dir/src/renderer/changeLogs/currentVersion.md;
  remote_markdown_path=$changelog_dir/release_notes/$proj_version.md

  echo "================================================================\n"
  echo "[pub_changelog] checkout changelog content:";
  echo ""
  tput setaf 2; # show green
  echo -e | cat $src_markdown;
  tput sgr0;
  echo "================================================================\n"

  echo "[pub_changelog] start publishing changelog to remote $remote_markdown_path";

  if [ ! -z $RABBY_REALLY_COPY ]; then
    aws s3 cp $src_markdown s3://${RABBY_BUILD_BUCKET}/rabby/$remote_markdown_path --acl public-read --exclude "*" --include "*.md" --content-type text/plain
  fi

  echo ""
  echo "[pub_changelog] the changelog is https://download.rabby.io/$remote_markdown_path"
  echo ""
  echo "[pub_changelog] you can update the cdn with cmd \`aws cloudfront create-invalidation --distribution-id <frontend_id> --paths '/$changelog_dir/*'\`"
  echo "[pub_changelog] finished update changelog, version: $proj_version";
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
