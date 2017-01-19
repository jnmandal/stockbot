'use strict'
const fetch  = require('node-fetch');

/*
 * InlineQueryAnswer
 * an abstract data structure to represent an inline query answer
 */
class InlineQueryAnswer {
  constructor(inlineQueryId, results) {
    this.query = {
      inline_query_id: inlineQueryId,
      results: results || [],
      cache_time: 0
    }
    this.toJSON = this.toJSON.bind(this);
  }
  toJSON() {
    return JSON.stringify(this.query);
  }
}

/*
 * @function answerInlineQuery
 * implements telegram's answerInlineQuery function
 * @param inlineQueryId the query_id we are responding to
 * @param results the possible results available
 */
function answerInlineQuery(inlineQueryId, results) {
  const endpoint = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/answerInlineQuery`;
  let answer = new InlineQueryAnswer(inlineQueryId, results);
  return fetch(endpoint, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    body:  answer.toJSON()
  }).then(result => result.json());
}

module.exports = {
  answerInlineQuery
}
