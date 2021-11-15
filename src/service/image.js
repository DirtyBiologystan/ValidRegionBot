const axios = require("axios");
var Chance = require('chance');

var chance = new Chance();


module.exports = {
  getNextPixel:async(config,image,apiURL)=>{
    const {data:departementPixels} = await axios.get(`${apiURL}/pixels/zone/?departement=${config.regionName}`);
    const {data:departement} = await axios.get(`${apiURL}/departements/?name=${config.regionName}`);
    let i=0;
    const pixelToReturn= departementPixels.reduce((accu,pixel)=>{
      if(pixel.hexColor !== image[pixel.x-departement.min.x][pixel.y-departement.min.y]) {
        accu.push({color: image[pixel.x-departement.min.x][pixel.y-departement.min.y],x:pixel.x,y:pixel.y});
      }
      return accu;
    },[])
    return chance.pickset(pixelToReturn,config.numberOfPixelReturn);
  }

}
