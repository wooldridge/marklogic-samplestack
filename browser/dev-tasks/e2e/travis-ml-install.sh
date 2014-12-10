#!/bin/bash

# runs command from parameters and exits with the eoror code of the command
# if it fails
function successOrExit {
    "$@"
    local status=$?
    if [ $status -ne 0 ]; then
        echo "$1 exited with error: $status"
        exit $status
    fi
}

# find today
day=$(date +"%Y%m%d")
# if the user passed a day string as a param then use it instead
test $1 && day=$1
# make a version number out of the date
ver="8.0-$day"

echo "********* Will be using MarkLogic nightly $ver"

# fetch/install ML nightly
fname="MarkLogic-$ver.x86_64.rpm"
fnamedeb="MarkLogic-$ver.x86_64.deb"

url="http://root.marklogic.com/nightly/builds/linux64/rh6-intel64-80-test-1.marklogic.com/HEAD/pkgs.$day/$fname"
echo "********* Downloading MarkLogic nightly $ver"


status=$(curl -k --anyauth -u $MLBUILD_USER:$MLBUILD_PASSWORD --head --write-out %{http_code} --silent --output /dev/null $url)
if [[ $status = 200 ]]; then
  successOrExit curl -k --anyauth -u $user:$pass -o ./$fname $url

  fname=$(pwd)/$fname

  sudo apt-get install alien dpkg-dev debhelper build-essential
  sudo alien -h
  sudo alien -d -k $fname
  sudo dpkg -i $fnamedeb

  echo "********* MarkLogic nightly $ver installed"
else
  echo "CANNOT DOWNLOAD: status = $status for date $day (URL=\"$url\")"
  exit 1
fi
