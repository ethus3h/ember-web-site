#!/usr/bin/env bash
#set -x

((EUID)) && exec sudo -- "$0" "$@"
trap 'printf '\''%b'\'' '\''\033[1;31m'\'' >&2; echo "A fatal error was reported on ${BASH_SOURCE[0]} line ${LINENO} in $(pwd)." >&2; printf '\''%b'\'' '\''\033[0m'\'' >&2; exit 1' ERR

sudo apt-get --yes install git; git clone https://github.com/ethus3h/wreathe-base.git

./wreathe-base/debian-package-generate/dpkg-wreathe-setup

echo "export KDEWM=compiz" > ~/.config/plasma-workspace/env/wm.sh

chmod +x ~/.config/plasma-workspace/env/wm.sh
