/**
 * Preloads all of the fridge data
 * @return {Promise} result data
 */
function preload() { // eslint-disable-line
  return new Promise((resolve, reject) => {
    $.getJSON('preload', (data) => {
      if (data.hasOwnProperty('error')) {
        reject(data);
        return;
      }
      resolve(data);
    });
  });
}

/**
 * Captures all of the filtered fridge data
 * @param {json} options the url parameters for the filtered search
 * @return {json} the filtered result from the server
 */
function loadData(options) { // eslint-disable-line
  const params = $.param(options, true);
  return new Promise((resolve, reject) => {
    $.getJSON(`api?${params}`, (data) => {
      if (data.hasOwnProperty('error')) {
        reject(data);
        return;
      }
      resolve(data);
    });
  });
}

/**
 * Captures all of the fridge stats
 * @return {json} the stats results from the server
 */
function loadStats() { // eslint-disable-line
  return new Promise((resolve, reject) => {
    $.getJSON(`stats`, (data) => {
      if (data.hasOwnProperty('error')) {
        reject(data);
        return;
      }
      resolve(data);
    });
  });
}
