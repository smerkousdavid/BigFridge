/*
 * Imports
 */
const url = require('url');
const fs = require('fs');

/**
 * Generic Utilities class to better handle the routing
 */
class Util {
  /**
   * Method to parse url query
   * @param {string} request the full request url
   * @return {json} json mapped url query
   */
  static parseQuery(request) {
    return url.parse(request.url, true).query;
  }

  /**
   * Method to read and parse json files
   * @param {string} path string path to json file
   * @return {json} loaded json data
   */
  static readJsonFile(path) {
    return JSON.parse(fs.readFileSync(path));
  }

  /**
   * Fast json sorting function
   * @param {array} arr input json array
   * @param {string} attr the attribute to sort by
   * @param {boolean} reverse sort by ascending or descending
   * @return {array} the new sorted array
   */
  static sortJson(arr, attr, reverse) {
    if (reverse) {
      return arr.sort((a, b) => {
        const x = (a[attr] === null) ? '' : a[attr];
        const y = (b[attr] === null) ? '' : b[attr];
        return x < y ? 1 : x > y ? -1 : 0;
      });
    } else {
      return arr.sort((a, b) => {
        const x = (a[attr] === null) ? '' : a[attr];
        const y = (b[attr] === null) ? '' : b[attr];
        return x < y ? -1 : x > y ? 1 : 0;
      });
    }
  };
};

module.exports = Util;
