const process = require("process");
const axios = require("axios");

const discord = require("./service/discord");
const processEvent = require("./service/processEvent");
const { getNextPixel } = require("./service/image");
const { gestionRole } = require("./service/gestion");



const apiURL = process.env.URL_API;
processEvent.on("config", async (config) => {
  let image;
  let pixelNeedChange;

  // let imageObject=[];
  let messageOfPixel;
  // let pixelNeedChange;
  const myDepartement = (await axios.get(
    `${apiURL}/departements/?name=${config.departementName}`
  )).data
  try {
    console.log(config);
    const client = await discord.client;
    const guild = await client.guilds.fetch(config.idGuild);
    let channel;
    if (!config.channel.public) {
      channel = await guild.channels.cache.get(config.channel.public);
    }
    const channel_log = await guild.channels.cache.get(config.channel.log);
    const channel_image = await guild.channels.cache.get(config.channel.image);
    if (channel_image) {
      let messages = await channel_image.messages.fetch();
      await Promise.all(
        messages.map(async (message) => {
          await message.delete();
        })
      );
    }
    if (config.image) {
      image = require(`./image/${config.image}`);
      // for (var x = 0; x < image.length; x++) {
      //   for (var y = 0; y < image[x].length; y++) {
      //     imageObject.push({ color:image[x][y],x,y});
      //   }
      // }

      const { pixels: pixelNeedChange, message } = await getNextPixel(
        config,
        image,
        apiURL,
        myDepartement
      );
      await await channel_image.send(message);
      messageOfPixel = await discord.sendMessageForPixelChange(
        pixelNeedChange,
        channel_image,
        {},
        ""
      );
    }
    let allrole = Object.values(config.role.region);
    allrole.push(config.role.valide);

    console.log(`Logged in as ${client.user.tag} in ${guild.name}!`);

    channel_log.send("I am up!");

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
          messageOfPixel = await discord.sendMessageForPixelChange(
            pixelNeedChange,
            channel_image,
            messageOfPixel,
            `<@&${config.role.gardien}> `
          );
        }
      }
      if (
        messageOfPixel &&
        messageOfPixel[pixel.x] &&
        messageOfPixel[pixel.x][pixel.y]
      ) {
        if (messageOfPixel[pixel.x][pixel.y].pixel.color === pixel.hexColor) {
          await (await messageOfPixel[pixel.x][pixel.y].message).delete();
          let messages = await channel_image.messages.fetch();
          if (messages.size === 1) {
            await messages.last().delete();
            const { pixels: pixelNeedChange, message } = await getNextPixel(
              config,
              image,
              apiURL,
              myDepartement
            );
            await channel_image.send(message);
            messageOfPixel = await discord.sendMessageForPixelChange(
              pixelNeedChange,
              channel_image,
              {},
              ""
            );
          }
        }
      }

      if (pixel.modifier.author !== pixel.author) {
        if (
          pixel.oldHexColor ===
          (image &&
          image[pixel.x - myDepartement.min.x] &&
          image[pixel.x - myDepartement.min.x][pixel.y - myDepartement.min.y] &&
          image[pixel.x - myDepartement.min.x][pixel.y - myDepartement.min.y] !== 0
            ? image[pixel.x - myDepartement.min.x][pixel.y - myDepartement.min.y]
            : config.color)
        ) {
          const member = await discord.getMemberByCoordonne(
            config.idGuild,
            pixel.x,
            pixel.y
          );
          if (member && channel) {
            await (
              await channel.send(
                `${
                  member.nickname ? member.nickname : member.user.username
                }! ton pixel a été changé de couleur!`
              )
            ).react(config.reaction.negatif);
          }
        } else if (
          pixel.hexColor ===
          (image &&
          image[pixel.x - myDepartement.min.x] &&
          image[pixel.x - myDepartement.min.x][pixel.y - myDepartement.min.y] &&
          image[pixel.x - myDepartement.min.x][pixel.y - myDepartement.min.y] !== 0
            ? image[pixel.x - myDepartement.min.x][pixel.y - myDepartement.min.y]
            : config.color)
        ) {
          const member = await discord.getMemberByCoordonne(
            config.idGuild,
            pixel.x,
            pixel.y
          );
          if (channel) {
            await (
              await channel.send(
                `${
                  member
                    ? member.nickname
                      ? member.nickname
                      : member.user.username
                    : `[${pixel.x}:${pixel.y}]`
                } arbore nos couleurs de force!`
              )
            ).react(config.reaction.positif);
          }
        }
        return;
      }

      if (departement && config.regionName === departement.region) {
        const member = await discord.getMemberByCoordonne(
          config.idGuild,
          pixel.x,
          pixel.y
        );
        if (
          pixel.hexColor ===
          (image &&
          image[pixel.x - myDepartement.min.x] &&
          image[pixel.x - myDepartement.min.x][pixel.y - myDepartement.min.y] &&
          image[pixel.x - myDepartement.min.x][pixel.y - myDepartement.min.y] !== 0
            ? image[pixel.x - myDepartement.min.x][pixel.y - myDepartement.min.y]
            : config.color)
        ) {
          if (channel) {
            await (
              await channel.send(
                `${
                  member
                    ? member.nickname
                      ? member.nickname
                      : member.user.username
                    : `[${pixel.x}:${pixel.y}]`
                } arbore nos couleurs !`
              )
            ).react(config.reaction.positif);
          }
          await discord.addRole(
            member,
            config.role.valide,
            allrole,
            channel_log
          );
          return;
        } else if (
          pixel.hexColor.toUpperCase() ===
          (image &&
          image[pixel.x - myDepartement.min.x] &&
          image[pixel.x - myDepartement.min.x][pixel.y - myDepartement.min.y] &&
          image[pixel.x - myDepartement.min.x][pixel.y - myDepartement.min.y] !== 0
            ? image[pixel.x - myDepartement.min.x][pixel.y - myDepartement.min.y]
            : config.color)
        ) {
          await discord.addRole(
            member,
            config.role.region[config.regionName],
            allrole,
            channel_log
          );
          if (channel) {
            await (
              await channel.send(
                `${
                  member ? `<@${member.id}>` : `[${pixel.x}:${pixel.y}]`
                } nous trompe pour le ${pixel.hexColor} !`
              )
            ).react(config.reaction.negatif);
          }
          return;
        } else {
          await discord.addRole(
            member,
            config.role.region[config.regionName],
            allrole,
            channel_log
          );
          return;
        }
      } else if (
        pixel.hexColor.toUpperCase() ===
        (image &&
        image[pixel.x - myDepartement.min.x] &&
        image[pixel.x - myDepartement.min.x][pixel.y - myDepartement.min.y] &&
        image[pixel.x - myDepartement.min.x][pixel.y - myDepartement.min.y] !== 0
          ? image[pixel.x - myDepartement.min.x][pixel.y - myDepartement.min.y]
          : config.color)
      ) {
        if (channel) {
          if (departement) {
            await (
              await channel.send(
                `[${pixel.x}:${pixel.y}] de la région "${departement.region}" ("${departement.name}") arbore notre couleur !`
              )
            ).react(config.reaction.positif);
          } else {
            await (
              await channel.send(
                `[${pixel.x}:${pixel.y}] d'un territoire inconnu a adopté la bonne couleur !`
              )
            ).react(config.reaction.positif);
          }
        }
      }
    });
    await gestionRole({config,image,guild,myDepartement,allrole,channel_log});
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
});
// 906991307069718570
// 906992272753696838
// 906991362551992320
// 906993680626360321
