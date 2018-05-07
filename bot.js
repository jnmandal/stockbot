'use strict'
require('dotenv').config();
const TelegramUpdateQueue = require('./telegram/queue');
const Logger = require('./logger');

/*
 * Data persistence
 * updates are generated on an interval
 * then stored in a queue
 */
let queue = new TelegramUpdateQueue();
queue.onEnqueue = (update) => {
  let updateAmount = queue.updates.length;
  Logger.debug(`Enqueued update_id: ${update.update_id}`);
  Logger.debug(`Updates In queue: ${updateAmount}`);
}

queue.listen();
Logger.info(`Telegram data layer boot success`);

// main loop
setInterval(() => {
  if (queue.updates.length > 0) {
    let update = queue.dequeue();
    let updateAmount = queue.updates.length;
    Logger.debug(`Dequeued update_id: ${update.update_id}`);
    Logger.debug(`Updates In queue: ${updateAmount}`);
    processUpdate(update);
  }
}, 1);
Logger.info(`Message queue listener boot success`);

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
    handleInline(update.inline_query);
  } else if (update.message.entities) {
    handleStandard(update.message.text, update.message.entities)
  } else {
    Logger.warn(`Unhandled update ${JSON.stringify(update)}`)
  }
}

function handleStandard(text, entities) {
  const commands = entities
    .filter(ent => ent.type == 'bot_command')
    .map(ent => text.slice(ent.offset, ent.offset + ent.length))
  Logger.info(`command[telegram.standard],text[${text}],commands[${commands.join('|')}]`);
  commands.forEach(handleCommand);
}

function handleCommand(command) {
  switch (command) {
    case '/start':
      Logger.warn('Implement a response to start command');
      break;
    case '/help':
      Logger.warn('Implement a response to help command');
      break;
    default:
      Logger.warn(`Implement a response to unknown command: ${command}`);
  }
}

function handleInline(inlineQuery) {
  Logger.info(`query[telegram.inline],id[${inlineQuery.from.id}],handle[${inlineQuery.from.username}],query[${inlineQuery.query}]`);
  const query = inlineQuery.query
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
        Logger.error('error in xignite superquote', err);
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
        Logger.error('error in xignite factset fundamentals', err);
      })
  ]).then(() => {
    // provide a summary and chart option or fallback to three composite charts
    const choices = (query && data.price) ?
      [inlineSummary(data), inlineChart(data)] :
      [inlineCompositeChart('nasdaq'), inlineCompositeChart('dow'), inlineCompositeChart('sp500')]
    answerInlineQuery(inlineQuery.id, choices);
  });
}
