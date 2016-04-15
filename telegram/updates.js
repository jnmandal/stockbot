'use strict'
const fetch  = require('node-fetch');
const config = require('../config');

/* 
 * @function getUpdates
 * implements telegram's getUpdates function
 * @param offset the offset to send for polling
 */
function getUpdates(offset) {
  const endpoint = `https://api.telegram.org/bot${config.telegramToken}/getUpdates${offset ? ('?offset='+offset) : ''}`;
  return fetch(endpoint)
    .then(result => result.json());
}

module.exports = {
  getUpdates
}
