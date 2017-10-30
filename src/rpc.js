const EventEmitter = require('events');

const emitter = new EventEmitter();

module.exports = {
  on: emitter.on.bind(emitter),
  emit: emitter.emit.bind(emitter),
  off: emitter.removeListener.bind(emitter),
  once: emitter.once.bind(emitter),
};
