#!/usr/bin/env bash
set -e

sudo add-apt-repository ppa:ethereum/ethereum -y
sudo add-apt-repository ppa:jonathonf/python-3.6

sudo apt-get update
sudo apt-get install -y python3.6 python3-pip
sudo apt-get install -y build-essential solc ethereum

virtualenv -p python3.6 venv
venv/bin/pip install --upgrade pip
venv/bin/pip install -r simulation/drequirements.txt

# install nvm
# https://github.com/creationix/nvm
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm

nvm install v8.10.0
nvm use 8.10.0

npm install -g truffle
npm install -g ganache-cli

npm install
