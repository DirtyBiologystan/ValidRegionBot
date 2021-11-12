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
  addRole: async (member, role, allrole, channel_log) => {
    if (!member) {
      return;
    }
    if (!member.roles.cache.has(role)) {
      console.log("add role pour :", member.nickname, "role:", role);
      channel_log.send(`Ajout du role <@&${role}> à <@${member.id}>`);
      await member.roles.add(role);
    }
    const rolesToRemove = allrole.filter((role2) => role2 != role);
    await Promise.all(
      rolesToRemove.map(async (removeRole) => {
        if (member.roles.cache.has(removeRole)) {
          console.log(
            "remove role pour :",
            member.nickname,
            "role:",
            removeRole
          );
          channel_log.send(
            `Retrait du role <@&${removeRole}> à <@${member.id}>`
          );

          await member.roles.remove(removeRole);
        }
      })
    );
  },
  getMemberByCoordonne: async (guildId, x, y) => {
    const guild = await (await module.exports.client).guilds.fetch(guildId);
    let members = await guild.members.fetch();
    console.log(members.length);
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
};
