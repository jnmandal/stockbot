'use strict'
const fetch  = require('node-fetch');

/*
 * @function getUpdates
 * implements telegram's getUpdates function
 * @param offset the offset to send for polling
 */
function getUpdates(offset) {
  const endpoint = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/getUpdates${offset ? ('?offset='+offset) : ''}`;
  return fetch(endpoint)
    .then(result => result.json());
}

module.exports = {
  getUpdates
}
