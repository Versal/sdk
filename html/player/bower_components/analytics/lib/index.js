
/**
 * Analytics.js
 *
 * (C) 2013 Segment.io Inc.
 */

var Integrations = require('analytics.js-integrations');
var Analytics = require('./analytics');
var each = require('each');


/**
 * Expose the `analytics` singleton.
 */

var analytics = module.exports = exports = new Analytics();

/**
 * Expose require
 */

analytics.require = require;

/**
 * Expose `VERSION`.
 */

exports.VERSION = require('./version');

/**
 * Add integrations.
 */

each(Integrations, function (name, Integration) {
  analytics.use(Integration);
});
