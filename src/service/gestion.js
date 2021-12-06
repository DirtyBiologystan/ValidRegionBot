
const fs = require('fs/promises');

module.exports = {
  saveConfig: async (config) => {
    const configOrigin = await fs.readFile(`${__dirname}/../config.json`,{encoding:"utf-8"});
    const configArray = JSON.parse(configOrigin);
    configArray[config.id]=config;
    await fs.writeFile(`${__dirname}/../config.json`,JSON.stringify(configArray,null,2),{encoding:"utf-8"});
  }
}
