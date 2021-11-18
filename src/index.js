const child_process = require("child_process");
const configs = require("./config");
const socketIo = require("./service/socket.io");

(async () => {
  const socket = await socketIo.socket;
  const processs = await Promise.all(
    configs.map(async (config,id) => {
      const process = await new Promise((resolve, reject) => {
        const processInP = child_process.fork(`${__dirname}/prosse.js`);
        processInP.on("spawn", () => {
          resolve(processInP);
        });
        processInP.on("error", (e) => {
          resolve(e);
        });
      });
      process.send({ type: "config", data: config });
      return process;
    })
  );
  socket.on("changePixel", (pixel) => {
    processs.forEach((process) => {
      process.send({ type: "changePixel", data: pixel });
    });
  });
  processs.forEach((process,id1)=>{
    process.on("message",(data)=>{
      console.log(data);
      processs.forEach((process,id2) => {
        if(id1 !== id2){
          process.send(data);
        }
      });
    })
  })

})().then(console.log, console.error);
