/*
 * versal-cli
 * http://versal.com/
 *
 * Copyright (c) 2013 Versal Team
 */


'use strict';

// Project metadata.
var pkg = require('../package.json');

// Display grunt-cli version.
exports.version = function() {
  console.log('versal-cli v' + pkg.version);
};

// Show help, then exit with a message and error code.
exports.fatal = function(msg, code) {
  exports.helpHeader();
  console.log('Fatal error: ' + msg);
  console.log('');
  exports.helpFooter();
  process.exit(code);
};

// Show help and exit.
exports.help = function() {
  exports.helpHeader();
  exports.helpFooter();
  process.exit();
};

// Help header.
exports.helpHeader = function() {
  console.log('versal-cli: ' + pkg.description + ' (v' + pkg.version + ')');
  console.log('');
};

// Help footer.
exports.helpFooter = function() {
  [
    'If you\'re seeing this message, Versal Gadget SDK hasn\'t been installed',
    'locally to your project. For more information about installing and configuring',
    'Versal Gadget SDK, please see the Getting Started guide:',
    '',
    'http://versal.com/sdk/getting-started',
  ].forEach(function(str) { console.log(str); });
};
