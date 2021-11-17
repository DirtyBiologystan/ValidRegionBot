const async = require("async");
const axios = require("axios");
const reg = /^.*[\<[|(]\s*(\d{1,3})[:;\-\/\., ]*(\d{1,3})\s*[\]|>)].*$/;
const discord = require("./discord");

const apiURL = process.env.URL_API;

module.exports = {
  gestionRole : async({config,image,guild,myDepartement,allrole,channel_log})=>{
    const q = async.queue(async ({ x, y, member, hexColor, region}) => {
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
        if (
          hexColor.toUpperCase() ===
          (image &&
          image[x - myDepartement.min.x] &&
          image[x - myDepartement.min.x][y - myDepartement.min.y] &&
          image[x - myDepartement.min.x][y - myDepartement.min.y] !== 0
            ? image[x - myDepartement.min.x][y - myDepartement.min.y]
            : config.color)
        ) {
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
  }
}
