const axios = require("axios");
var Chance = require("chance");
const getPixels = require("get-pixels");
const { writeFile } = require("fs/promises");
var chance = new Chance();

const convertNumberToHex = (number) => {
  if (number < 16) {
    return `0${number.toString(16).toUpperCase()}`;
  } else {
    return `${number.toString(16).toUpperCase()}`;
  }
};

module.exports = {
  getNextPixel: async (config, image, apiURL, departement) => {
    const { data: departementPixels } = await axios.get(
      `${apiURL}/pixels/zone/?region=${config.regionName}`
    );
    let i = 0;
    const pixelToReturn = departementPixels.reduce((accu, pixel) => {
      if(!(image[pixel.x - departement.min.x] && image[pixel.x - departement.min.x][pixel.y - departement.min.y])){
        return accu;
      }
      i++;
      if (
        image[pixel.x - departement.min.x][pixel.y - departement.min.y] != 0 &&
        pixel.hexColor.toUpperCase() !==
          image[pixel.x - departement.min.x][pixel.y - departement.min.y]
      ) {
        accu.push({
          color: image[pixel.x - departement.min.x][pixel.y - departement.min.y],
          x: pixel.x,
          y: pixel.y,
          colorOld: pixel.hexColor,
        });
      }
      return accu;
    }, []);
    if (pixelToReturn.length) {
      //let pixels = chance.pickset(pixelToReturn, config.numberOfPixelReturn);
      let pixels = pixelToReturn.slice(0, config.numberOfPixelReturn);
      return {
        message: `Pour aider, choisissez une des coordonnées ci dessous, et remplacez la couleur par la valeur indiquée (utilisez des réactions pour indiquer quel pixel vous occupez)
${
  config.lienMap
    ? `Pour ceux qui préfèrent choisir la zone qu'ils veulent dessiner, voici la map des pixels ${config.lienMap}
`
    : ""
}Image faite à ${
          Math.floor((1 - pixelToReturn.length / image.flat().length) * 10000) /
          100
        } % soit ${pixelToReturn.length} / ${image.flat().length} restant`,
        pixels,
      };
    }
    return { message: "Image terminée, Bravo à tous et toutes!", pixels: [] };
  },
  imageToJson: (config, buffer,channel_log) => {
    return new Promise((resolve) => {
      console.log(buffer)
      getPixels(buffer,"image/png", function (err, pixels) {
        if (err) {
          console.error(err);
          channel_log.send(`error, ${err}`)
          return;
        }
        const jsonResulte = [];

        for (var x = 0; x < pixels.shape[0]; x++) {
          jsonResulte[x] = [];
        }
        console.log(pixels.shape);
        let i = 0;
        for (var y = 0; y < pixels.shape[1]; y++) {
          for (var x = 0; x < pixels.shape[0]; x++) {
            if (pixels.data[i + 3] === 0) {
              jsonResulte[x][y] = 0;
            } else {
              jsonResulte[x][y] = `#${convertNumberToHex(
                pixels.data[i]
              )}${convertNumberToHex(pixels.data[i + 1])}${convertNumberToHex(
                pixels.data[i + 2]
              )}`;
            }
            i += 4;
          }
        }
        // console.log(jsonResulte);
        writeFile(
          `${__dirname}/../image/${config.image}`,
          JSON.stringify(jsonResulte)
        );
        resolve(jsonResulte);
      });
    });
  },
};
