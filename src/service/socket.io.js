const io = require("socket.io-client");
let socketURL = process.env.URL_SOCKETIO;

const socket = io(socketURL);
module.exports = {
  socket: new Promise((resolve) =>
    socket.on("connect", () => {
      console.log("socket.io connecter");
      socket.emit("newPixel");
      socket.emit("changePixel");
      resolve(socket);
    })
  ),
};
