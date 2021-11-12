const { EventEmitter } = require("events");

module.exports = new EventEmitter();

process.on("message", async (message) => {
  module.exports.emit(message.type, message.data);
});
