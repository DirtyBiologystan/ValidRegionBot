const getPixels = require("get-pixels");
const { writeFile } = require('fs/promises');

const convertNumberToHex= (number)=>{
  if(number<16){
    return `0${number.toString(16).toUpperCase()}`
  }else{
    return `${number.toString(16).toUpperCase()}`

  }
}

getPixels(`${__dirname}/image/forets.png`, function(err, pixels) {
  if(err){
    console.error(err);
  }
  console.log(pixels.shape)
  const jsonResulte=[];

  for (var x = 0; x < pixels.shape[0]; x++) {
    jsonResulte[x]=[];
  }

  let i=0;
  for (var y = 0; y < pixels.shape[1]; y++) {
    for (var x = 0; x < pixels.shape[0]; x++) {
      if(pixels.data[i+3]===0){
        jsonResulte[x][y]=0;
      }else{
        jsonResulte[x][y]=`#${convertNumberToHex(pixels.data[i])}${convertNumberToHex(pixels.data[i+1])}${convertNumberToHex(pixels.data[i+2])}`
      }
      i+=4;
    }
  }
  console.log(jsonResulte);
  writeFile(`${__dirname}/../src/image/forét.json`,JSON.stringify(jsonResulte))
})
