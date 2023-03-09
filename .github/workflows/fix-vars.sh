#!/usr/bin/env sh

if [ -z $USERPROFILE ]; then
  export USERPROFILE="C:\\Users\\Administrator"
  echo "[Windows] fix USERPROFILE as $USERPROFILE";
fi
