#!/bin/sh

set -e

rm -rf ./player/build
mkdir ./player/build
cp -r ../player/dist ./player/build/dist
cp ../player/app/index.html.tmpl ./player/build/dist
