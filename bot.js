'use strict'
require('dotenv').config();
const TelegramUpdateQueue = require('./telegram/queue');

/*
 * Data persistence
 * updates are generated on an interval
 * then stored in a queue
 */
let queue = new TelegramUpdateQueue();
queue.onEnqueue = (update) => {
  let updateAmount = queue.updates.length;
  if (process.env.DEBUG) {
    console.log(`[${new Date()}] - Enqueued update_id: ${update.update_id}`);
    console.log(`[${new Date()}] - Updates In queue: ${updateAmount}`);
  }
}

queue.listen();
console.log(`[${new Date()}] - Telegram data layer boot success`);

// main loop
setInterval(() => {
  if (queue.updates.length > 0) {
    let update = queue.dequeue();
    let updateAmount = queue.updates.length;
    if (process.env.DEBUG) {
      console.log(`[${new Date()}] - Dequeued update_id: ${update.update_id}`);
      console.log(`[${new Date()}] - Updates In queue: ${updateAmount}`);
    }
    processUpdate(update);
  }
}, 1);
console.log(`[${new Date()}] - Message queue listener boot success`);

const answerInlineQuery = require('./telegram/inline').answerInlineQuery;
const getQuote = require('./xignite/quotes').getQuote;
const getFundamentals = require('./xignite/fundamentals').getFundamentals;

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const inlineSummary = (data) =>
  ({
    id: uuidv4(),
    type: 'article',
    title: `💰 ${data.ticker.toUpperCase()} - ${data.price} (${data.dayChange}%)`,
    description: `Summary data for ${data.ticker.toUpperCase()}`,
    input_message_content: {
      message_text: `${data.name} (${data.ticker.toUpperCase()}) \nprice: ${data.price}\n% today change: ${data.dayChange}%\n% 7 day change: ${data.weekChange}%\n% 52 week change: ${data.yearChange}\nfour week high/low: ${data.fourWeekHigh}/${data.fourWeekLow}\nbeta: ${data.beta}\nPE ratio: ${data.pe}`
    }
  })

const inlineChart = (data) =>
  ({
    id: `${uuidv4()}-photo`,
    type: 'photo',
    title: `📈 ${data.ticker.toUpperCase()} - Chart (52 weeks)`,
    description: `52 week line chart for ${data.ticker.toUpperCase()}`,
    thumb_url: `https://finviz.com/chart.ashx?t=${data.ticker.toUpperCase()}&ty=l&s=m`,
    photo_url: `https://finviz.com/chart.ashx?t=${data.ticker.toUpperCase()}&ty=l&ta=1`
  })

const inlineCompositeChart = (composite) =>
  ({
    id: `${uuidv4()}-photo`,
    type: 'photo',
    title: `📈 ${composite.toUpperCase()} - Chart (intraday)`,
    description: `Intraday candlestick chart for ${composite.toUpperCase()}`,
    thumb_url: `https://finviz.com/image.ashx?${composite}?s=m`,
    photo_url: `https://finviz.com/image.ashx?${composite}`
  })


function processUpdate(update) {
  if (update.inline_query) {
    console.log(`[${new Date()}] - query[telegram.inline],id[${update.inline_query.from.id}],handle[${update.inline_query.from.username}],query[${update.inline_query.query}]`);
    const query = update.inline_query.query
    let data = { ticker: query }
    Promise.all([
      getQuote(data.ticker)
        .then(response => {
          if (response.Outcome === 'Success') {
            // grab the pertinent data
            data.name      = response['Name'];
            data.price     = response['Last'];
            data.dayChange = response['PercentChange'];
          }
        })
        .catch((err) => {
          console.log('error in xignite superquote');
          console.log(err);
        }),
      getFundamentals(data.ticker)
        .then(fundamentals => {
          data.beta           = fundamentals['Beta']
          data.pe             = fundamentals['PERatio']
          data.marketCap      = fundamentals['MarketCapitalization']
          data.fourWeekHigh   = fundamentals['HighPriceLast4Weeks']
          data.fourWeekLow    = fundamentals['LowPriceLast4Weeks']
          data.weekChange     = fundamentals['PercentPriceChange1Week']
          data.fourWeekChange = fundamentals['PercentPriceChange4Weeks']
          data.yearChange     = fundamentals['PercentPriceChange52Weeks']
        })
        .catch((err) => {
          console.log('error in xignite factset fundamentals');
          console.log(err);
        })
    ]).then(() => {
      // provide a summary and chart option or fallback to three composite charts
      const choices = (query && data.price) ?
        [inlineSummary(data), inlineChart(data)] :
        [inlineCompositeChart('nasdaq'), inlineCompositeChart('dow'), inlineCompositeChart('sp500')]
      answerInlineQuery(update.inline_query.id, choices);
    });
  }
}
