#!/bin/sh

if [ -z $VERSION ]; then
  echo "VERSION is not set"
  exit 1
fi

npm --no-git-tag-version version $VERSION
cd release/app && npm --no-git-tag-version version $VERSION && cd ../..
