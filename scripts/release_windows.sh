#!/bin/sh

# cp to aws
if [ -z $RABBY_BUILD_BUCKET ]; then
  echo "[release_windows] RABBY_BUILD_BUCKET is empty, exit";
  exit 1;
fi

echo "[release_windows] start packaging...";
npm run package

script_dir="$( cd "$( dirname "$0"  )" && pwd  )"
project_dir=$(dirname "$script_dir")
export_path="$project_dir/release/build"

parse_ver_name() {
  echo "$(ls -la $export_path)" 2> /dev/null | sed -e '/[^\.exe]$/d' -e '/\.$/d' -e 's/.*RabbyDesktop\ Setup \(.*\)\.exe/\1/g'
}

INSTALLER_SOURCE="RabbyDesktop Setup $(parse_ver_name).exe";
INSTALLER_BASENAME="rabby-desktop-setup-$(parse_ver_name)-win32";

echo "[release_windows] INSTALLER_SOURCE is $INSTALLER_SOURCE";
echo "[release_windows] local path is $export_path/$INSTALLER_SOURCE";
echo "[release_windows] INSTALLER_BASENAME is $INSTALLER_BASENAME";

if [ -z "$INSTALLER_BASENAME" ]; then
  echo "[release_windows] INSTALLER_BASENAME is empty, exit";
  exit 1;
fi

# time
DATE=`date '+%Y%m%d_%H%M%S'`
HASH_YML_NAME="RabbyDesktop-$DATE.yml";

LATEST_EXE_PATH=downloads/rabby-desktop/win32/backups/${INSTALLER_BASENAME}-$DATE.exe
LATEST_YML_PATH=downloads/rabby-desktop/win32/backups/${INSTALLER_BASENAME}-$DATE.yml

echo "[release_windows]";
echo "[release_windows] expect download urls: "
echo "[release_windows] backup: https://download.debank.com/${LATEST_EXE_PATH};"
echo "[release_windows] latest: https://download.debank.com/downloads/rabby-desktop/rabby-desktop-setup-latest-win32.exe;"

echo "[release_windows] start uploading...";

S3_LATEST_EXE=s3://${RABBY_BUILD_BUCKET}/${LATEST_EXE_PATH}
S3_LATEST_YML=s3://${RABBY_BUILD_BUCKET}/${LATEST_YML_PATH}

# backup
aws s3 cp "$export_path/${INSTALLER_SOURCE}" $S3_LATEST_EXE --acl public-read --profile debankbuild
aws s3 cp $export_path/latest.yml $S3_LATEST_YML --acl public-read --profile debankbuild
aws s3 cp "$S3_LATEST_EXE" s3://${RABBY_BUILD_BUCKET}/downloads/rabby-desktop/win32/${INSTALLER_BASENAME}.exe --acl public-read --profile debankbuild
aws s3 cp "$S3_LATEST_YML" s3://${RABBY_BUILD_BUCKET}/downloads/rabby-desktop/win32/${INSTALLER_BASENAME}.yml --acl public-read --profile debankbuild

# update latest
aws s3 cp "$S3_LATEST_EXE" s3://${RABBY_BUILD_BUCKET}/downloads/rabby-desktop/rabby-desktop-setup-latest-win32.exe --acl public-read --profile debankbuild;
aws s3 cp "$S3_LATEST_YML" s3://${RABBY_BUILD_BUCKET}/downloads/rabby-desktop/rabby-desktop-setup-latest-win32.yml --acl public-read --profile debankbuild

echo "[release_windows] uploaded...";
