'use strict'
const getUpdates = require('./updates').getUpdates;

/*
 * TelegramUpdateQueue
 * a queue data structure to keep track of updates from polling
 * coupled to getUpdates as described at:
 * https://core.telegram.org/bots/api#getting-updates
 */
class TelegramUpdateQueue {
  constructor(interval) {
    // instance variables
    this.updates = [];
    this.offset  = -1;
    // instance methods
    this.enqueue = this.enqueue.bind(this);
    this.dequeue = this.dequeue.bind(this);
    this.contains = this.contains.bind(this);
    this.getAndStoreUpdates = this.getAndStoreUpdates.bind(this);
    this.listen = this.listen.bind(this);
  }
  enqueue(update) {
    if (this.contains(update)) return false;
    this.updates.push(update);
    this.offset = update.update_id + 1;
    if (typeof this.onEnqueue === 'function') this.onEnqueue(update);
    return this.updates;
  }
  contains(update) {
    for(let i=0; i < this.updates.length; i++) {
      if (this.updates[i].update_id === update.update_id) return true;
    }
    return false;
  }
  dequeue() {
    let update = this.updates.shift();
    if (typeof this.onDequeue == 'function') this.onDequeue(update);
    return update;
  }
  getAndStoreUpdates() {
    return getUpdates(this.offset)
      .then(response => {response.result.forEach(this.enqueue)})
      .catch(err => {
        console.log(`[${new Date()}] - ERROR: unable to enqueue updates`)
        console.log(err)
      })
  }
  listen() {
    this
      .getAndStoreUpdates()
      .then(this.listen);
  }
}

module.exports = TelegramUpdateQueue;
