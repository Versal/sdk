#!/bin/sh

set -e

cd ../gadget-docs
npm install
grunt
cd ../sdk
rm -rf ./docs
cp -r ../gadget-docs/dist ./docs
