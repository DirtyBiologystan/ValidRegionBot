const axios = require("axios");
const async = require("async");
const discord = require("./service/discord");
const processEvent = require("./service/processEvent");
const process = require("process");

const reg = /^.*[\<[|(]\s*(\d{1,3})[:;\-\/\., ]*(\d{1,3})\s*[\]|>)].*$/;

let apiURL = "http://back:8000";

processEvent.on("config", async (config) => {
  try {
    let allrole = Object.values(config.role.region);
    allrole.push(config.role.valide);

    console.log(config);
    const client = await discord.client;
    const guild = await client.guilds.fetch(config.idGuild);

    console.log(`Logged in as ${client.user.tag} in ${guild.name}!`);

    const channel = await guild.channels.cache.get(config.channel.public);
    const channel_log = await guild.channels.cache.get(config.channel.log);

    channel_log.send("I am up!");

    processEvent.on("changePixel", async (pixel) => {
      if (pixel.modifier.author !== pixel.author) {
        if (pixel.oldHexColor === config.color) {
          const member = await discord.getMemberByCoordonne(
            config.idGuild,
            pixel.x,
            pixel.y
          );
          if (member) {
            await (
              await channel.send(
                `${member.nickname
                  ? member.nickname
                  : member.user.username}! ton pixel a été changé de couleur!`
              )
            ).react(config.reaction.negatif);
          }
        }else if(pixel.hexColor === config.color){
          const member = await discord.getMemberByCoordonne(
            config.idGuild,
            pixel.x,
            pixel.y
          );
          if (member) {
            await (
              await channel.send(
                `${
                  member
                    ? member.nickname
                      ? member.nickname
                      : member.user.username
                    : `[${pixel.x}:${pixel.y}] arbore nos couleurs !(mais c'est pas lui qui la fait^^)`
                }`
              )
            ).react(config.reaction.positif);
          }
        }
        return;
      }
      let [departement] = (
        await axios(`${apiURL}/departements/?x=${pixel.x}&y=${pixel.y}`)
      ).data;

      if (departement && config.regionName === departement.region) {
        // if(!config.departementName || config.departementName === departement.name){
        const member = await discord.getMemberByCoordonne(
          config.idGuild,
          pixel.x,
          pixel.y
        );
        if (pixel.hexColor === config.color) {
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
          await discord.addRole(
            member,
            config.role.valide,
            allrole,
            channel_log
          );
          return;
        } else if (pixel.oldHexColor === config.color) {
          await discord.addRole(
            member,
            config.role.region[config.regionName],
            allrole,
            channel_log
          );
          await (
            await channel.send(
              `${
                member ? `<@${member.id}>` : `[${pixel.x}:${pixel.y}]`
              } nous trompe pour le ${pixel.hexColor} !`
            )
          ).react(config.reaction.negatif);
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
        // }
      } else if (pixel.hexColor === config.color) {
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
    });

    const q = async.queue(async ({ x, y, member, hexColor, region }) => {
      if (!region) {
        [region] = (
          await axios(
            `${apiURL}/departements/?x=${parseInt(x)}&y=${parseInt(y)}`
          )
        ).data;
      }

      if (region) {
        region = region.region;
      } else {
        region = "autre";
      }
      if (!config.role.region[region]) {
        region = "autre";
      }

      let role = config.role.region[region];
      if (region === config.regionName) {
        if (!hexColor) {
          ({ hexColor } = (
            await axios(`${apiURL}/pixels/?x=${parseInt(x)}&y=${parseInt(y)}`)
          ).data);
        }
        if (hexColor === config.color) {
          role = config.role.valide;
        }
      }
      await discord.addRole(member, role, allrole, channel_log);
    }, 10);
    q.error(function (err, task) {
      console.error(err);
    });
    setInterval(async () => {
      try {
        let members = await guild.members.fetch();
        members = members.filter((member) => !member.user.bot);

        let membersPars = await Promise.all(
          members.map(async (member) => {
            if (config.coordonneFix[member.id]) {
              return {
                ...config.coordonneFix[member.id],
                name: member.nickname,
                member,
              };
            }
            const pars = reg.exec(
              member.nickname ? member.nickname : member.user.username
            );
            if (!pars) {
              console.log(member.nickname, member.user.username);
              let pixel;
              try {
                pixel = (
                  await axios(`${apiURL}/pixels/?idDiscord=${member.id}`)
                ).data;
              } catch (e) {
                return false;
              }
              if (pixel) {
                return {
                  hexColor: pixel.hexColor,
                  x: pixel.x,
                  y: pixel.y,
                  member,
                  region: pixel.departements,
                };
              } else {
                return false;
              }
            }
            return { x: pars[1], y: pars[2], member };
          })
        );
        membersPars = membersPars.filter((membersPar) => membersPar);
        q.push(membersPars);
      } catch (e) {
        console.error(e);
      }
    }, config.time);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
});
// 906991307069718570
// 906992272753696838
// 906991362551992320
// 906993680626360321
