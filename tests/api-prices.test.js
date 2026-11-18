const test = require('node:test');
const assert = require('node:assert/strict');
const handler = require('../api/prices.js');

test('GET /api/prices handler returns structured payload with all required currencies', async () => {
  let statusCode = null;
  let headers = {};
  let responseBody = null;

  const mockReq = { method: 'GET', query: {} };
  const mockRes = {
    status(code) {
      statusCode = code;
      return this;
    },
    setHeader(key, val) {
      headers[key] = val;
    },
    json(data) {
      responseBody = data;
      return this;
    },
    end() {
      return this;
    }
  };

  await handler(mockReq, mockRes);

  assert.equal(statusCode, 200);
  assert.ok(responseBody, 'Response body must exist');
  assert.ok('isLive' in responseBody, 'Must specify isLive boolean');
  assert.ok('updatedAtReadable' in responseBody, 'Must specify updatedAtReadable');
  assert.ok(responseBody.currencies, 'Must return currencies map');

  // Verify all supported currencies exist
  for (const curr of ['PKR', 'USD', 'SAR', 'AED', 'GBP']) {
    const rate = responseBody.currencies[curr];
    assert.ok(rate, `Currency ${curr} must exist in rates`);
    assert.ok(rate.goldPricePerGram > 0, `${curr} gold price per gram must be > 0`);
    assert.ok(rate.silverPricePerGram > 0, `${curr} silver price per gram must be > 0`);
    assert.ok(rate.goldPricePerTola > 0, `${curr} gold price per tola must be > 0`);
    assert.ok(rate.silverPricePerTola > 0, `${curr} silver price per tola must be > 0`);
  }

  // If live is false, verify fallback notice exists
  if (!responseBody.isLive) {
    assert.ok(responseBody.notice, 'Fallback notice must exist when live price is unavailable');
    assert.equal(responseBody.notice, 'Live price unavailable. Please check the price below.');
    assert.equal(responseBody.currencies.PKR.goldPricePerGram, 35322);
    assert.equal(responseBody.currencies.PKR.silverPricePerGram, 432.8);
  }
});
