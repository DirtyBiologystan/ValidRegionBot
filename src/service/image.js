const axios = require("axios");
var Chance = require("chance");

var chance = new Chance();

module.exports = {
  getNextPixel: async (config, image, apiURL, departement) => {
    const { data: departementPixels } = await axios.get(
      `${apiURL}/pixels/zone/?region=${config.regionName}`
    );
    let i = 0;
    const pixelToReturn = departementPixels.reduce((accu, pixel) => {
      i++;
      if (
        image[pixel.x - departement.min.x][pixel.y - departement.min.y] != 0 &&
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
    if (pixelToReturn.length) {
      let pixels = chance.pickset(pixelToReturn, config.numberOfPixelReturn);
      return {
        message: `Pour aider, choisir une des coordonnées ci dessous, et remplacez la couleur par la valeur indiquée (utilisez des réactions pour indiquer quel pixel vous occupez)
${
  config.lienMap
    ? `Pour se qui préfère choisir la zone qu'il veux dessiné, voici la map des pixels ${config.lienMap}
`
    : ""
}Image faite à ${
          Math.floor((1 - pixelToReturn.length / image.flat().length) * 10000) /
          100
        } % soit ${pixelToReturn.length} / ${image.flat().length} restant`,
        pixels,
      };
    }
    return { message: "Image terminée, Bravo à tous et touse!", pixels: [] };
  },
};
