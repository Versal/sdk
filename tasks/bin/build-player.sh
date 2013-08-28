#!/bin/sh

set -e

rm -rf ./player/build
git clone ../player-master ./player/build
cd ./player/build

# Checkout a branch or ref
# TODO Should be set to `master` when dust settles.
git checkout master

git submodule update --init
npm install
grunt reset --config ../../player.json

cd ../..

# Kill .gits
rm -rf ./player/build/.git
rm -rf ./player/build/app/scripts/shared-libs/.git

cp -r ./node_modules/asset-stubs/stubs/sdk/fixtures/assets.json \
      ./player/build/dist/scripts/views/stubbed/asset_picker/assets.json
cp -r ./node_modules/asset-stubs/stubs/sdk/fixtures/assets.json \
      ./player/fixtures/assets.json

rm -rf ./player/fixtures/assets
cp -r ./node_modules/asset-stubs/stubs/sdk/assets ./player/fixtures/assets
