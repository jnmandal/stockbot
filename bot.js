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
  console.log(`[${new Date()}] - Enqueued update_id: ${update.update_id}`);
  console.log(`[${new Date()}] - Updates In queue: ${updateAmount}`);
}

queue.listen();
console.log(`[${new Date()}] - Telegram data layer boot success`);

// main loop
setInterval(() => {
  if (queue.updates.length > 0) {
    let update = queue.dequeue();
    let updateAmount = queue.updates.length;
    console.log(`[${new Date()}] - Dequeued update_id: ${update.update_id}`);
    console.log(`[${new Date()}] - Updates In queue: ${updateAmount}`);
    process(update);
  }
}, 1);
console.log(`[${new Date()}] - Message queue listener boot success`);

const answerInlineQuery = require('./telegram/inline').answerInlineQuery;
const getQuote = require('./xignite/quotes').getQuote;
const getSummary = require('./yahoo/api').getSummary;

function process(update) {
  if (update.inline_query) {
    console.log(`[${new Date()}] - query[telegram.inline],id[${update.inline_query.from.id}],handle[${update.inline_query.from.username}]`);
    let data = { ticker: update.inline_query.query}
    Promise.all([
      getQuote(data.ticker)
        .then(response => {
          if (response.Outcome === 'Success') {
            // grab the pertinent data
            data.name = response.Name;
            data.price = response.Last;
            data.priceTime = response.DateTime;
            data.dayChange = response.PercentChange;
          } else {
            data.ticker = 'N/A';
          }
        })
        .catch(() => data.ticker = 'N/A'),
      getSummary(data.ticker)
        .then(response => {
          const resData = response.quoteSummary.result[0];
          data.yearChange = resData.defaultKeyStatistics["52WeekChange"].fmt;
        })
        .catch(() => data.yearChange = 'N/A')
    ]).then(() => {
      let option = {
        id: update.inline_query.query,
        type: 'article',
        title: `💰 ${data.ticker.toUpperCase()} - last: ${data.price}`,
        input_message_content: {
          message_text: `${data.name} (${data.ticker}) \nprice: ${data.price} \n@time: ${data.priceTime} \n% today change: ${data.dayChange} \n% 52 week change ${data.yearChange}`
        }
      }
      answerInlineQuery(update.inline_query.id, [option]);
    });
  }
}
