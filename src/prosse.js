const process = require("process");
const axios = require("axios");

const discord = require("./service/discord");
const processEvent = require("./service/processEvent");
const { getNextPixel, imageToJson } = require("./service/image");

const apiURL = process.env.URL_API;
processEvent.on("config", async (config) => {
  let image;
  let pixelNeedChange;

  let messageOfPixel;
  const myDepartement = (
    await axios.get(`${apiURL}/departements/?name=${config.departementName}`)
  ).data;
  try {
    console.log(config);
    const client = await discord.client;
    const guild = await client.guilds.fetch(config.idGuild);
    const channel_log = await guild.channels.cache.get(config.channel.log);
    let channel_image = await guild.channels.cache.get(config.channel.image);
    if (config.image) {
      await channel_log.send(
        "Envoyé une image ici pour mettre a jour l'image utilisé (vous devez étre en mode construction pour faire ça, a par si il y a trés peut de modification)"
      );
      if (channel_image) {
        channel_image = await discord.cleanChannel(channel_image,config);
      }
      image = require(`./image/${config.image}`);

      const collectorImage = channel_log.createMessageCollector(
        (message) => message.attachments.size === 1,
        { max: Number.MAX_VALUE }
      );

      collectorImage.on("collect", async (message) => {
        const url = await message.attachments.first().url;
        await channel_log.send("chargement de l'image");
        const req = await axios(url, {
          responseType: "arraybuffer",
        });
        image = await imageToJson(config, req.data, channel_log);
        await channel_log.send("clean du channel 'Pixels'");
        channel_image = await discord.cleanChannel(channel_image,config);
        const { pixels: pixelNeedChange, messageText } = await getNextPixel(
          config,
          image,
          apiURL,
          myDepartement
        );
        if (!config.surveil && messageText) {
          await channel_image.send(messageText);
        }
        if (config.revolution) {
          if (pixelNeedChange.length) {
            process.send({
              type: "alert",
              data: {
                pixelNeedChange,
                prefix: config.message,
              },
            });
          }
        }
        await channel_log.send(
          "envoi des nouveaux message (véfier les premier fois pixels, pour évité les problémes)"
        );
        messageOfPixel = await discord.sendMessageForPixelChange(
          pixelNeedChange,
          channel_image,
          {},
          config,
          ""
        );
      });

      const { pixels: pixelNeedChange, message } = await getNextPixel(
        config,
        image,
        apiURL,
        myDepartement
      );
      if (!config.surveil) {
        await channel_image.send(message);
      }
      if (config.revolution) {
        if (pixelNeedChange.length) {
          setTimeout(()=>{
            process.send({
              type: "alert",
              data: {
                pixelNeedChange,
                prefix: config.message,
              },
            });
          },10000);
        }
      }
      messageOfPixel = await discord.sendMessageForPixelChange(
        pixelNeedChange,
        channel_image,
        {},
        config,
        ""
      );
    }
    let allrole;
    if (!config.revolution) {
      allrole = Object.values(config.role.region);
      allrole.push(config.role.valide);
    }
    console.log(`Logged in as ${client.user.tag} in ${guild.name}!`);

    await channel_log.send("I am up!");
    if (config.surveil) {
      processEvent.on("react", async (pixel) => {
        if (messageOfPixel[pixel.x] && messageOfPixel[pixel.x][pixel.y]) {
          if (!(await messageOfPixel[pixel.x][pixel.y].message).deleted) {
            await (
              await messageOfPixel[pixel.x][pixel.y].message
            ).react(config.reaction.positif);
          }
        }
      });
      processEvent.on("unreact", async (pixel) => {
        if (messageOfPixel[pixel.x] && messageOfPixel[pixel.x][pixel.y]) {
          if (!(await messageOfPixel[pixel.x][pixel.y].message).deleted) {
            await (
              await messageOfPixel[pixel.x][pixel.y].message
            ).reactions.removeAll();
          }
        }
      });
      processEvent.on("alert", async (data) => {
        messageOfPixel = await discord.sendMessageForPixelChange(
          data.pixelNeedChange,
          channel_image,
          messageOfPixel,
          config,
          `${data.prefix ? data.prefix : ""}${
            data.garde ? `<@&${config.role.gardien}> ` : ""
          }`
        );
      });
    }

    processEvent.on("changePixel", async (pixel) => {
      let [departement] = (
        await axios(`${apiURL}/departements/?x=${pixel.x}&y=${pixel.y}`)
      ).data;
      if (
        config.surveil &&
        departement &&
        config.regionName === departement.region
      ) {
        const { pixels: pixelNeedChange, message } = await getNextPixel(
          config,
          image,
          apiURL,
          myDepartement
        );
        if (pixelNeedChange.length) {
          process.send({
            type: "alert",
            data: {
              pixelNeedChange,
              prefix: config.reaction.représentation,
              garde: true,
            },
          });
          messageOfPixel = await discord.sendMessageForPixelChange(
            pixelNeedChange,
            channel_image,
            messageOfPixel,
            config,
            `${config.reaction.représentation}<@&${config.role.gardien}> `
          );
        }
      }
      if (
        messageOfPixel &&
        messageOfPixel[pixel.x] &&
        messageOfPixel[pixel.x][pixel.y]
      ) {
        if (messageOfPixel[pixel.x][pixel.y].pixel.color === pixel.hexColor) {
          if (!(await messageOfPixel[pixel.x][pixel.y].message).deleted) {
            await (await messageOfPixel[pixel.x][pixel.y].message).delete();
            messageOfPixel[pixel.x][pixel.y] = undefined;
            let messages = await channel_image.messages.fetch();
            if (messages.size === 1 && !config.surveil) {
              await messages.last().delete();
              const { pixels: pixelNeedChange, message } = await getNextPixel(
                config,
                image,
                apiURL,
                myDepartement
              );
              if (config.revolution) {
                if (pixelNeedChange.length) {
                  process.send({
                    type: "alert",
                    data: {
                      pixelNeedChange,
                      prefix: config.message,
                    },
                  });
                }
              }
              await channel_image.send(message);
              messageOfPixel = await discord.sendMessageForPixelChange(
                pixelNeedChange,
                channel_image,
                {},
                config,
                ""
              );
            }
          }
        }
      }
    })
  } catch (e) {
    console.error(config.regionNam,config.departementNam,e);
    process.exit(1);
  }
});
