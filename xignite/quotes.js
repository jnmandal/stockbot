const fetch = require('node-fetch');
const xigniteEmail = require('../config').xigniteEmail;

/*
 * @function getQuote
 * GETs a quote from xignite
 * @param quote - the ticker
 */
function getQuote(quote) {
  const endpoint = `http://superquotes.xignite.com/xSuperQuotes.json/GetQuote?IdentifierType=Symbol&Identifier=${quote}&header_username=${xigniteEmail}`
  return fetch(endpoint)
    .then(response => response.json())
}

module.exports = {
    getQuote
}
