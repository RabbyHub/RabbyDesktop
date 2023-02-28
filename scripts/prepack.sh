#!/bin/sh

get_envs() {
	RABBY_HOST_OS=`uname`
	RABBY_HOST_ARCH=`uname -m`

	case ${RABBY_HOST_OS} in
		MINGW*|CYGWIN*)
			RABBY_HOST_OS="Windows"
      RAY_IS_WIN_BASH=true
			;;
	esac

  case $OSTYPE in
    msys*|cygwin*)
			RABBY_HOST_OS="Windows"
      RAY_IS_WIN_BASH=true
			;;
  esac

	case ${RABBY_HOST_ARCH} in
		i386|i686) RABBY_HOST_ARCH="x86";;
		x86_64|amd64) RABBY_HOST_ARCH="x64";;
		armv6) RABBY_HOST_ARCH="armv6";;
		armv7|armv7s|armv7l) RABBY_HOST_ARCH="arm";;
		aarch64) RABBY_HOST_ARCH="arm64";;
		mips|mipsel) RABBY_HOST_ARCH="mips";;
		mips64) RABBY_HOST_ARCH="mips64";;
		powerpc) RABBY_HOST_ARCH="ppc";;
		ppc64) RABBY_HOST_ARCH="ppc64";;
	esac
}

get_envs;

npm i;
# check if windows
if [ $RABBY_HOST_OS == "Windows" ]; then
  echo "Windows, Not support yet"
elif [ $RABBY_HOST_OS == "Darwin" ]; then
  npm run package:darwin:arm64;
  npm run package:darwin:x64;
  ./scripts/rename_dist.sh
fi
