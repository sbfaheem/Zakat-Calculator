/**
 * Vercel Serverless Function: GET /api/prices
 * Maintained for backward compatibility.
 * Delegates to the unified /api/metal-rates pipeline.
 */

const metalRatesHandler = require('./metal-rates.js');

module.exports = async function handler(req, res) {
  return metalRatesHandler(req, res);
};
