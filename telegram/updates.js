'use strict'
const fetch  = require('node-fetch');
const Logger = require('../logger');

/*
 * @function getUpdates
 * implements telegram's getUpdates function
 * @param offset the offset to send for polling
 */
function getUpdates(offset) {
  const endpoint = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/getUpdates?timeout=10&${offset ? ('offset='+offset+'&') : ''}`;
  Logger.debug(`Fetching updates w/ offset: ${offset}`);
  return fetch(endpoint)
    .then(result => result.json());
}

module.exports = {
  getUpdates
}
