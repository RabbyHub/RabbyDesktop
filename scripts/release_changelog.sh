#!/bin/sh

script_dir="$( cd "$( dirname "$0"  )" && pwd  )"
project_dir=$(dirname "$script_dir")

. $script_dir/fns_release.sh --source-only

pub_changelog;
