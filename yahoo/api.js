const fetch = require('node-fetch');

/*
 * @function getSummary
 * GETs a summary data from yahoo
 * @param ticker - the identifier for the stock/etf/equity
 */
function getSummary(ticker) {
  const endpoint = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=defaultKeyStatistics`;
  return fetch(endpoint)
    .then(response => response.json())
}

module.exports = {
  getSummary
}
