const fetch = require('node-fetch');

const fundamentalTypes = [
  'MarketCapitalization',
  'PERatio',
  'HighPriceLast4Weeks',
  'LowPriceLast4Weeks',
  'PercentPriceChange52Weeks',
  'PercentPriceChange1Week',
  'Beta',
  'PercentPriceChange4Weeks'
]

const asOfDate = () => {
  let d = new Date();
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

/*
 * @function getFundamentals
 * GETs comppany fundamentals from xignite
 * @param quote - the ticker
 */
function getFundamentals(ticker) {
  const endpoint = `https://factsetfundamentals.xignite.com/xFactSetFundamentals.json/GetFundamentals` +
    `?IdentifierType=Symbol&Identifiers=${ticker}&FundamentalTypes=${fundamentalTypes.join(',')}` +
    `&AsOfDate=${asOfDate()}&ReportType=TTM&ExcludeRestated=False&UpdatedSince=` +
    `&header_username=${process.env.XIGNITE_EMAIL}`
  return fetch(endpoint)
    .then(response => response.json())
    .then(json => {
      const data = {}
      if (json[0]['Outcome'] == 'Success') {
        const fList = json[0]['FundamentalsSets'][0]['Fundamentals'];
        fList.forEach(fundamental => data[fundamental.Type] = fundamental.Value);
      }
      return data;
    });
}

module.exports = {
  getFundamentals
}
