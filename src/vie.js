const axios = require("axios");
const async = require("async");
const { Client, Intents } = require("discord.js");
const client = new Client({
  intents: [Intents.FLAGS.GUILD],
});
const reg = /^.*\[\s*(\d{1,3})[:;\-\/\., ]*(\d{1,3})\s*].*$/;

let color = "#10FFB8";
let valide = "907600441255264278";
let corespondance = {
  // "Coeur historique": "906992272753696838",
  // Crashapagos: "906991362551992320",
  // autre: "906993680626360321",
};

let allrole = Object.values(corespondance);
allrole.push(valide);
client.on("error", console.error);
client.on("ready", async () => {
  try {
    // const Guild = client.guilds.cache.get("905024934517047307");
    // corespondance = Object.keys(corespondance).reduce((accu,key)=>{
    //   accu[corespondance[key]] = Guild.roles.cache.find(r => r.id === key);
    //   return accu;
    // },{});

    console.log(`Logged in as ${client.user.tag}!`);
    // console.log(guild.members.cache);
    // Promise.all(
    //   guild.members.map(async(member)=>{
    //     console.log(member.nickname);
    //   })
    // );
    //   (async()=>{
    //     let guilds = await client.guilds.fetch();
    //     let guild = await guilds.get("905024934517047307").fetch();
    //
    //     console.log(users.keys());
    // })();

    // console.log(Object.keys(client.users.cache))
    const guild = await client.guilds.fetch("905078332444528660");

    let members = await guild.members.fetch();
    console.log(members.length);
    members = members.filter((member) => !member.user.bot);

    let membersPars = members.map((member) => {
      const pars = reg.exec(
        member.nickname ? member.nickname : member.user.username
      );
      if (!pars) {
        console.log(member.nickname, member.user.username);
        return false;
      }
      return { x: pars[1], y: pars[2], name: pars[3], member };
    });
    membersPars = membersPars.filter((membersPar) => membersPar);
    // membersPars = membersPars.filter((membersPar,i)=>i<10);
    // console.log(membersPars.length);
    var q = async.queue(async ({ x, y, member }) => {
      // let [{ region }] = (
      //   await axios(
      //     `https://api.codati.ovh/departements/?x=${parseInt(x)}&y=${parseInt(y)}`
      //   )
      // ).data;
      //
      // if (!corespondance[region]) {
      //   region = "autre";
      // }
      //
      // let role = corespondance[region];
      // if (region === "Coeur historique") {
      let { hexColor } = (
        await axios(
          `https://api.codati.ovh/pixels/?x=${parseInt(x)}&y=${parseInt(y)}`
        )
      ).data;
      let role;
      if (hexColor === color) {
        role = valide;
      }
      if (role) {
        if (!member.roles.cache.has(role)) {
          console.log("add role pour :", member.nickname);
          await member.roles.add(role);
        }
      }

      const removeRoles = allrole.filter((role2) => role2 != role);
      await Promise.all(
        removeRoles.map(async (removeRole) => {
          if (member.roles.cache.has(removeRole)) {
            console.log("remove role pour :", member.nickname, hexColor);
            await member.roles.remove(removeRole);
          }
        })
      );
      // }
    }, 10);
    q.error(function (err, task) {
      console.error(err, task.member.nickname);
    });
    setInterval(() => {
      console.log(`${q.running()}/${q.length()}`);
    }, 3000);
    q.push(membersPars);
    await q.drain();
    process.exit(0);
  } catch (e) {
    console.error(e);
  }
});
// 906991307069718570
// 906992272753696838
// 906991362551992320
// 906993680626360321
/*
//:022
intents = discord.Intents().all()  # Creating the bot intents
client = commands.Bot(command_prefix=".", intents=intents)  # Initiating the bot reffered to as client

*/

// setInterval(async ()=>{
//   try{
//     let members = Guild.members.cache;
//     members = members.filter((member)=>!member.user.bot);
//     let membersPars = members.map((member)=>
//     {
//       const pars = reg.exec(member.nickname)
//       return  {x:pars[1],y:pars[2],name:pars[3],member};
//     });
//
//     await Promise.all(
//     membersPars.map(async(member)=>{
//         console.log(region);
//         if(!corespondance[region]){
//           region="autre";
//         }
//
//         // console.log(region);
//         // console.log(member.member.roles)
//         await member.member.roles.add(corespondance[region]);
//
//         let pixels = (await axios(`https://api.codati.ovh/pixels/?x=${member.x}&y=${member.y}`)).data;
//         console.log(pixels);
//     }));
//   }catch(e){
//     console.error(e)
//   }
//
//
// },5000)

client.login(process.env.TOKEN);
