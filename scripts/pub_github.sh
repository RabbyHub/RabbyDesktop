#!/bin/bash

script_dir="$( cd "$( dirname "$0"  )" && pwd  )"
project_dir=$(dirname "$script_dir")

work_dir_rel=tmp/pub_github
work_dir=$project_dir/$work_dir_rel
rm -rf $work_dir;
mkdir -p $work_dir;

set_vars() {
  repo_owner="RabbyHub"
  repo_name="RabbyDesktop"
  draft_release_id=""

  cd $project_dir;
  # get current version
  if [ -z $app_version ]; then
    app_version=$(node -e "console.log(require('./package.json').version);")
  fi
  release_tag_name="v$app_version-prod"
  echo "[pub_github] app_version is $app_version"
  echo ""

  release_title="Rabby Desktop v$app_version"
  release_body=$(cat $project_dir/src/renderer/changeLogs/currentVersion.md)

  download_links=(
    https://download.rabby.io/wallet-desktop/darwin-x64/rabby-wallet-desktop-installer-x64-$app_version.dmg
    https://download.rabby.io/wallet-desktop/darwin-arm64/rabby-wallet-desktop-installer-arm64-$app_version.dmg
    https://download.rabby.io/wallet-desktop/win32-x64/rabby-wallet-desktop-installer-x64-$app_version.exe
  )

  downloaded_files=()
}

check_envs_for_releases() {
  echo "[pub_github] release_title: $release_title"
  echo "[pub_github] release_body:"
  echo ""
  echo "$release_body"
  echo ""

  # GitHub Account Info
  if [ -z $RABBY_DESKTOP_PUB_GITHUB_TOKEN ]; then
    echo "[pub_github] Please set RABBY_DESKTOP_PUB_GITHUB_TOKEN environment variable"
    exit 1
  fi
}

download_releases() {
  printf -v release_body "$release_body\n\n ======================== \n\n ### MD5\n\n"
  for remote_link in "${download_links[@]}"; do
    local filename=$(basename "$remote_link")
    local response=$(curl -s -I "$remote_link")
    local etag=$(node -e "
      console.log(
        \`$response\`.replace(/\r\n/g, '\n')
          .split('\n')
          .find(x => x.toLowerCase().includes('etag: '))
          .split(': ')[1].replace(/\"/g, '')
      )
    ")
    echo "[pub_github::download_releases] etag: $etag"

    downloaded_files+=("$work_dir/$filename")

    if [ ! -f "$work_dir/$filename" ]; then
      echo "[pub_github::download_releases] Downloading $filename"
      curl -L -o "$work_dir/$filename" "$remote_link"
      echo "[pub_github::download_releases] Downloaded $work_dir_rel/$filename"
    fi

    if [ -f /usr/bin/md5sum ]; then
      local md5str=($(md5sum "$work_dir/$filename"))
    else
      local md5str=($(md5 -q "$work_dir/$filename"))
    fi

    # leave here for debug
    # echo "[pub_github::download_releases] md5str: $md5str"

    # split string by space and get the first element
    local md5value=${md5str[0]}

    echo "[pub_github::download_releases] md5value: $md5value"
    echo ""

    # TODO: add \\\` to avoid json format error
    printf -v release_body "$release_body- \\\`$filename\\\`: $md5value\n"
  done
}

check_existing_release_draft() {
  local response=$(curl -s -H "Authorization: token $RABBY_DESKTOP_PUB_GITHUB_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/$repo_owner/$repo_name/releases?per_page=100")

  # leave here for debug
  # echo "[pub_github::check_existing_release_draft] response is $response"

  draft_release_id=$(echo $response | node -e "
    const input_data = require('fs').readFileSync(0, 'utf-8');
    const data = JSON.parse(input_data);
    const drafts = data.filter(item => item.name === '$release_title' && item.draft);
    console.log(drafts.length > 0 ? drafts[0].id : '');
  ")

  # leave here for debug
  echo "[pub_github::check_existing_release_draft] draft_release_id is $draft_release_id"

  if [ -n "$draft_release_id" ]; then
    echo "[pub_github::check_existing_release_draft] Release Draft already exists with ID: $draft_release_id"
  else
    echo "[pub_github::check_existing_release_draft] No existing Release Draft found."
  fi
}

update_release_draft() {
  cd $project_dir;

  if [ ! -z $draft_release_id ]; then
    local post_data=$(node -e "
      const post_data = {
        "tag_name": \"$release_tag_name\",
        "name": \"$release_title\",
        "body": \`$release_body\`,
        "draft": true,
      }

      process.stdout.write(JSON.stringify(post_data));
    ")

    # leave here for debug
    # echo "[pub_github::update_release_draft] post_data is $post_data"

    echo "[pub_github::update_release_draft] Draft Existed: $draft_release_id"
    local response=$(curl -s -X PATCH -H "Authorization: token $RABBY_DESKTOP_PUB_GITHUB_TOKEN" \
      -H "Accept: application/vnd.github+json" \
      "https://api.github.com/repos/$repo_owner/$repo_name/releases/$draft_release_id" \
      -d "$post_data")

    # leave here for debug
    # echo "[pub_github::update_release_draft] response is $response"

    echo "[pub_github::update_release_draft] Release Draft updated with new title and body."
  else
    local post_data=$(node -e "
      const post_data = {
        "tag_name": \"$release_tag_name\",
        "name": \"$release_title\",
        "body": \`$release_body\`,
        "draft": true,
      }

      process.stdout.write(JSON.stringify(post_data));
    ")

    # leave here for debug
    # echo "[pub_github::update_release_draft] post_data is $post_data"

    local response=$(curl -s -X POST -H "Authorization: token $RABBY_DESKTOP_PUB_GITHUB_TOKEN" \
      -H "Accept: application/vnd.github+json" \
      "https://api.github.com/repos/$repo_owner/$repo_name/releases" \
      -d "$post_data")

    # leave here for debug
    # echo "[pub_github::update_release_draft] response is $response"

    draft_release_id=$(echo $response | node -e "
      const input_data = require('fs').readFileSync(0, 'utf-8');
      const data = JSON.parse(input_data);
      console.log(data.id);
    ")
    echo "[pub_github::update_release_draft] Release Draft created with ID: $draft_release_id"
  fi
}

upload_files_to_release() {
  echo "[pub_github::upload_files_to_release] files to upload: $downloaded_files"

  for absfile in "${downloaded_files[@]}"; do
    local filename=$(basename "$absfile")
    # local upload_url="https://uploads.github.com/repos/$repo_owner/$repo_name/releases/$draft_release_id/assets?name=$filename&label=$filename"
    local upload_url="https://uploads.github.com/repos/$repo_owner/$repo_name/releases/$draft_release_id/assets"

    echo "[pub_github::upload_files_to_release] Uploading $filename to $upload_url"
    curl -s -X POST -H "Authorization: token $RABBY_DESKTOP_PUB_GITHUB_TOKEN" \
      -H "Content-Type: application/octet-stream" \
      --data-binary "@$absfile" \
      "$upload_url?name=$filename"

    echo "[pub_github::upload_files_to_release] Uploaded $filename"
    echo ""
  done
}

set_vars;
check_existing_release_draft;

download_releases;
check_envs_for_releases;

update_release_draft;
upload_files_to_release;
