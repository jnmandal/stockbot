'use strict'
const TelegramUpdateQueue = require('./telegram/queue');

/*
 * Data persistence
 * updates are generated on an interval
 * then stored in a queue
 */
let updates = new TelegramUpdateQueue();
updates.onEnqueue = (update) => {
  let updateAmount = updates.updates.length;
  console.log(`[${new Date()}] - Enqueued update_id: ${update.update_id}`);
  console.log(`[${new Date()}] - Updates In queue: ${updateAmount}`);
}
// check for updates every 800ms
updates.listen(800);
console.log('Beginning data persistence');

// main loop 
setInterval(() => {
  if (updates.updates.length > 0) {
    let update = updates.dequeue();
    let updateAmount = updates.updates.length;
    console.log(`[${new Date()}] - Dequeued update_id: ${update.update_id}`);
    console.log(`[${new Date()}] - Updates In queue: ${updateAmount}`);
    process(update);
  }
}, 1);

const answerInlineQuery = require('./telegram/inline').answerInlineQuery;
const getQuote = require('./xignite/quotes').getQuote;

function process(update) {
  if (update.inline_query) {
    getQuote(update.inline_query.query).then(response => {
      if (response.Outcome === 'Success') {
        let option = {
          id: update.inline_query.query,
          type: 'article',
          title: `💰 ${response.Identifier.toUpperCase()} - last: ${response.Last}`,
          input_message_content: {
            message_text: `${response.Name} (${response.Identifier}) \nprice: ${response.Last} \n@time: ${response.DateTime} \n% change: ${response.PercentChange}`
          }
        }
        answerInlineQuery(update.inline_query.id, [option]);
      }
    });
  }
}
