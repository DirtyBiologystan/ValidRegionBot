const { Client, Intents } = require("discord.js");

const reg = /^.*\[(\d{1,3})[:;/](\d{1,3})].*$/;

module.exports = {
  client: new Promise((resolve) => {
    const client = new Client({
      intents: [Intents.FLAGS.GUILD],
    });
    client.on("error", console.error);

    client.on("ready", () => {
      resolve(client);
    });
    client.login(process.env.TOKEN);
  }),
  getMemberByCoordonne: async (guildId, x, y) => {
    const guild = await (await module.exports.client).guilds.fetch(guildId);
    let members = await guild.members.fetch();
    members = members.filter((member) => !member.user.bot);
    return members.find((member) => {
      const coordonne = reg.exec(
        member.nickname ? member.nickname : member.user.username
      );
      if (!coordonne) {
        return false;
      }
      return x === Number(coordonne[1]) && y === Number(coordonne[2]);
    });
  },
  cleanChannel: async (channel) => {
    let messages = await channel.messages.fetch();
    await Promise.all(
      messages.map(async (message) => {
        if(! message.deleted){
          await message.delete();
        }
      })
    );
  },
  sendMessageForPixelChange: async (
    listPixel,
    channel,
    source,
    config,
    prefix
  ) => {
    return listPixel.reduce(async (accu, pixel) => {
      console.log(pixel)
      accu = await accu;
      if (!accu[pixel.x]) {
        accu[pixel.x] = {};
      }
      if (!accu[pixel.x][pixel.y]) {
        const pMessage = channel.send(
          `${prefix} [${pixel.x}:${pixel.y}] => ${pixel.colorOld} => **${pixel.color}**`
        );
        if (config.surveil) {
          pMessage.then((message) => {
            const collector = message.createReactionCollector(
              (reaction, user) => user.id !== "906987786702295112",
              { max: Number.MAX_VALUE, dispose: true }
            );
            collector.on("collect", () => {
              console.log("collect");
              process.send({ type: "react", data: pixel });
            });
            collector.on("dispose", () => {
              console.log("dispose");
              process.send({ type: "unreact", data: pixel });
            });
            collector.on("end", () => {
              console.log("end");
              console.log(collector.endReason());
            });
          });
        }
        accu[pixel.x][pixel.y] = {
          pixel,
          message: pMessage,
        };
      }

      return accu;
    }, source);
  },
};
