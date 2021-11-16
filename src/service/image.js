const axios = require("axios");
var Chance = require("chance");

var chance = new Chance();

module.exports = {
  getNextPixel: async (config, image, apiURL) => {
    const { data: departementPixels } = await axios.get(
      `${apiURL}/pixels/zone/?region=${config.regionName}`
    );
    const { data: departement } = await axios.get(
      `${apiURL}/departements/?name=${config.departementName}`
    );
    let i = 0;
    const pixelToReturn = departementPixels.reduce((accu, pixel) => {
      i++;
      if (image[pixel.x - departement.min.x][pixel.y - departement.min.y] != 0 &&
        pixel.hexColor.toUpperCase() !==
        image[pixel.x - departement.min.x][pixel.y - departement.min.y]
      ) {
        accu.push({
          color:
            image[pixel.x - departement.min.x][pixel.y - departement.min.y],
          x: pixel.x,
          y: pixel.y,
        });
      }
      return accu;
    }, []);
    if(pixelToReturn.length){
      let pixels = chance.pickset(pixelToReturn, config.numberOfPixelReturn);
      return {message:`Image faite à ${Math.floor((1-pixelToReturn.length/image.flat().length)*10000)/100 } % soit ${pixelToReturn.length} / ${image.flat().length} restant` ,pixels};
    }
    return {message:"Image terminée, Bravo à tous et touse!" ,pixels:[]};
  },
};
