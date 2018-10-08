/*
 * Imports
 */
const express = require('express');
const fs = require('fs');
const util = require('./util');

/*
 * Definitions
 */
const fridge = express();
const configsPath = __dirname + '/configs.json';
const staticPath = __dirname + '/static';
const fridgeDir = __dirname + '/fridge';
const dataDir = fridgeDir + '/data';
const rawDir = fridgeDir + '/generateData/rawData';

const paramOptions = {
  load: 50, // load a maximum per page
  page: 1, // load the first page
  type: null, // load all types
  search: null, // load all searches
  stores: [], // load all stores
  types: [], // load all types
  expired: false, // load non expired food items
  sortby: 'null', // don't sort by anything
  reversed: false, // don't reverse the sorting
  minPurchaseDate: 0, // load all min purchase dates
  maxPurchaseDate: Number.MAX_SAFE_INTEGER, // load all max purchase data
  minExpirationDate: 0, // load all min expiration dates
  maxExpirationDate: Number.MAX_SAFE_INTEGER, // load all max expiration dates
  minQuantity: 0, // load all min quantities
  maxQuantity: Number.MAX_SAFE_INTEGER, // load all max quantities
};

let preloaded = false;
let data = {
  data: [],
  raw: {
    types: [],
    stores: [],
  },
};

/*
 * Configs
 */
if (!fs.existsSync(configsPath)) {
  console.error('could not find configs.json in the same folder as server.js');
  process.exit(1);
}

// Load the server configs
const configs = util.readJsonFile(configsPath);

// imagesearch('logo google').pipe(fs.createWriteStream('google.jpg'));

/*
 * API calls
 */
// Handle the static folder
fridge.use(express.static(staticPath));

// Handle page preload
fridge.get('/preload', (request, response) => {
  if (preloaded) {
    console.log('the data has already been preloaded');
  } else {
    console.log('preloading data');
    fs.readdir(dataDir, (err, files) => {
      if (err) {
        console.error('failed to load data files', err);
        response.json({error: err});
        return;
      }

      // Load all of the data files
      console.log('loading into data');
      files.forEach((file) => {
        console.log('loading', file);
        try {
          const fileData = util.readJsonFile(`${dataDir}/${file}`);

          // Change the date's to UTC epoch timestamps
          fileData.forEach((v, i) => {
            try {
              fileData[i].purchaseDate = Date.parse(v.purchaseDate);
              fileData[i].expirationDate = Date.parse(v.expirationDate);
            } catch (err) {
              console.error('failed to parse food item dates', err);
            }
          });

          data.data.push(...fileData);
        } catch (err) {
          response.json({error: err});
          return;
        }
      });
    });

    // Load the file types and stores
    try {
      data.raw.types = util.readJsonFile(rawDir + '/foodTypes.json');
      data.raw.stores = util.readJsonFile(rawDir + '/stores.json');
      preloaded = true;
    } catch (err) {
      response.json({error: err});
      return;
    }
  }

  response.json(data.raw);
});

// handle basic API requests
fridge.get('/api', (request, response) => {
  const urlOptions = util.parseQuery(request);
  const options = Object.assign(paramOptions, urlOptions);

  // fix the filter types
  options.load = parseInt(options.load, 10);
  options.page = parseInt(options.page, 10);

  // fix all min-max values to be integer types
  Object.keys(options).forEach((v) => {
    if (v.includes('min') || v.includes('max')) {
      options[v] = parseInt(options[v], 10);
    }

    // update the null values
    if (options[v] === 'null') {
      options[v] = null;
    }

    // custom transformers
    switch (v) {
      case 'expired':
        options[v] = options[v] === 'true';
        break;
    };
  });

  // log the results
  console.log('new api request\nrequested options', options);

  // filter through all of the options
  let filtered = [];
  let passedFilter = 0; // optimized page search
  let expired = 0; // total expired counter
  let purchasedAfterExpiration = 0; // total purchased after expiration
  const checkFilter = (food, key) => (!options[key + 's']
      .includes(food[key]) && options[key + 's'].length > 0);
  const now = new Date().getTime(); // get the current UTC time

  // foor loop is better than forEach in this scenario
  // since we don't ref the ind before the data check
  // should probably use defaintjs (move this to web) for faster JSON searching
  // but this implementation suffices
  for (let ind = 0; ind < data.data.length; ind++) {
    // if (filtered.length >= options.load) break;

    // only copy the variable after the filter check
    let food = data.data[ind];

    // skip the added filter if we don't match the following criteria
    if (
      food.type !== (options.type || food.type) ||
      food.name !== (options.name || food.name) ||
      food.purchaseDate > options.maxPurchaseDate ||
      food.purchaseDate < options.minPurchaseDate ||
      food.expirationDate > options.maxExpirationDate ||
      food.expirationDate < options.minExpirationDate ||
      food.quantity < options.minQuantity ||
      food.quantity > options.maxQuantity ||
      (!food.name.toLowerCase()
          .includes((options.search || food.name).toLowerCase()) &&
      !food.store.toLowerCase()
          .includes((options.search || food.store).toLowerCase()) &&
      !food.type.toLowerCase()
          .includes((options.search || food.type).toLowerCase())) ||
      checkFilter(food, 'store') ||
      checkFilter(food, 'type') ||
      (options.expired ? (now < food.expirationDate) : false)
    ) {
      continue;
    }

    // load only the current successful filtered page
    if (passedFilter > (options.page - 1) * options.load &&
            filtered.length < options.load) {
      filtered.push(food);
    }

    // check if it has expired
    if (now < food.expirationDate) expired++;

    // check if it was bought after its expiration date
    if (food.purchaseDate > food.expirationDate) purchasedAfterExpiration++;

    // we've passed all of our filter checks
    passedFilter++;
  }

  if (options.sortby !== null) {
    filtered = util.sortJson(filtered.slice(),
        options.sortby, options.reversed === 'true');
  }

  response.json({results: passedFilter, data: filtered,
    expired, purchasedAfterExpiration, page: options.page});
});

fridge.get('/stats', (request, response) => {
  console.log('requesting stats');

  let expired = 0; // total expired counter
  let purchasedAfterExpiration = 0; // total purchased after expiration
  let lowestDate = new Date('01/01/2050');
  let highestDate = new Date('01/01/2000');
  const now = new Date().getTime(); // get the current UTC time

  // get the month difference
  const monthDiff = (d1, d2) => {
    let months = (d2.getFullYear() - d1.getFullYear()) * 12;
    months -= d1.getMonth() + 1;
    months += d2.getMonth();
    return months <= 0 ? 0 : months;
  };

  // get the lowest and highest dates
  data.data.forEach((v) => {
    let date = new Date(v.purchaseDate);
    if (date < lowestDate) lowestDate = date;
    if (date > highestDate) highestDate = date;
  });

  // isolate the food types
  const types = [];
  try {
    data.raw.types.forEach((v) => {
      if (!types.includes(v.name)) types.push(v.name);
    });
  } catch (err) {
    console.error('failed to load food types', err);
  }

  // referenced from post 3552461
  const monthNames = [
    'January', 'February', 'March',
    'April', 'May', 'June', 'July',
    'August', 'September', 'October',
    'November', 'December',
  ];

  // iterate through every month between the lowest and highest dates
  const monthData = [];
  const monthsApart = monthDiff(lowestDate, highestDate) + 2;
  for (let ind = 0; ind < monthsApart; ind++) {
    const monthObj = {
      name: monthNames[(lowestDate.getMonth() + ind) % 12],
    };

    types.forEach((v) => monthObj[v] = 0);
    monthData.push(monthObj);
  }

  // populate all of the stats
  for (let ind = 0; ind < data.data.length; ind++) {
    let food = data.data[ind];

    // check if it has expired
    if (now < food.expirationDate) expired++;

    // check if it was bought after its expiration date
    if (food.purchaseDate > food.expirationDate) purchasedAfterExpiration++;

    const diff = monthDiff(lowestDate, new Date(food.purchaseDate));
    monthData[diff][food.name] += food.quantity;
  }

  response.json({results: data.data.length, expired,
    purchasedAfterExpiration, monthData, types, months: monthDiff});
});

/*
 * App main
 */
fridge.listen(process.env.PORT || configs.server.port, (err) => {
  if (err) {
    console.log('Fridge server error', err);
  }
  console.log(`fridge server listenting (port: ${configs.server.port})`);
});
