/**
 * This script downloads all of the food type images found
 * in foodTypes.json into the imgs folder
 *
 * The API key is an enviroment variable called PEXELS_API
 */
const PexelsAPI = require('pexels-api-wrapper');
const fs = require('fs');
const request = require('request');
const util = require('./util');

// connect to pexels using the api wrapper (could easily be replaced)
const pexelsClient = new PexelsAPI(process.env.PEXELS_API);

// read foodTypes.json
const types = util.readJsonFile(__dirname +
                '/fridge/generateData/rawData/foodTypes.json');
const foodTypes = [];

// extract the names
types.forEach((v) => foodTypes.push(v.name));

// log the results
console.log('attempting to download the following images', foodTypes);

// search pexels and download the image
foodTypes.forEach((foodName) => {
  console.log('searching for', foodName);
  pexelsClient.search(foodName, 1, 1)
      .then((results) => {
        request(results.photos[0].src.small).pipe(
            fs.createWriteStream(__dirname + '/static/imgs/' +
            foodName.toLowerCase()) + '.jpg')
            .on('close', () => console.log('done downloading', foodName));
      }).catch((err) => {
        console.log(`failed to fetch photo ${foodName}!`, err);
      });
});
