const test = require('node:test');
const assert = require('node:assert/strict');
const handler = require('../api/metal-rates.js');
const Nisab = require('../nisab.js');

test('GET /api/metal-rates handler returns 200 with structured live/fallback payload', async () => {
  let statusCode = null;
  let headers = {};
  let body = null;

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
      body = data;
      return this;
    },
    end() {
      return this;
    }
  };

  await handler(mockReq, mockRes);

  assert.equal(statusCode, 200);
  assert.ok(body, 'Response body must exist');
  assert.equal(body.success, true);
  assert.ok('isLive' in body, 'Must specify isLive boolean');
  assert.ok('stale' in body, 'Must specify stale boolean');
  assert.ok('source' in body, 'Must specify source attribution');
  assert.ok('updatedAt' in body, 'Must specify updatedAt ISO string');
  assert.ok('updatedAtReadable' in body, 'Must specify human-readable updated time');

  // Verify 15-minute Cache-Control header
  assert.equal(headers['Cache-Control'], 'public, s-maxage=900, stale-while-revalidate=300');

  // Verify Gold data and Karats breakdown
  assert.ok(body.gold, 'Gold object must exist');
  assert.ok(body.gold.karats, 'Gold karats object must exist');
  for (const k of ['24K', '22K', '21K', '18K']) {
    const karatData = body.gold.karats[k];
    assert.ok(karatData, `Karat ${k} must exist`);
    assert.ok(karatData.perGram > 0, `${k} perGram must be > 0`);
    assert.ok(karatData.per10Gram > 0, `${k} per10Gram must be > 0`);
    assert.ok(karatData.perTola > 0, `${k} perTola must be > 0`);
  }

  // Verify Purity normalizations
  const g24 = body.gold.karats['24K'].perGram;
  const g22 = body.gold.karats['22K'].perGram;
  const g21 = body.gold.karats['21K'].perGram;
  const g18 = body.gold.karats['18K'].perGram;
  assert.ok(Math.abs(g22 - (g24 * 22 / 24)) < 1.0, '22K must be 22/24 of 24K');
  assert.ok(Math.abs(g21 - (g24 * 21 / 24)) < 1.0, '21K must be 21/24 of 24K');
  assert.ok(Math.abs(g18 - (g24 * 18 / 24)) < 1.0, '18K must be 18/24 of 24K');

  // Verify Silver data
  assert.ok(body.silver, 'Silver object must exist');
  assert.ok(body.silver.perGram > 0, 'Silver perGram must be > 0');
  assert.ok(body.silver.per10Gram > 0, 'Silver per10Gram must be > 0');
  assert.ok(body.silver.perTola > 0, 'Silver perTola must be > 0');

  // Verify Nisab calculations
  assert.ok(body.nisab, 'Nisab thresholds object must exist');
  assert.equal(body.nisab.silverNisabGrams, 612.36);
  assert.equal(body.nisab.silverNisabTola, 52.5);
  assert.equal(body.nisab.goldNisabGrams, 87.48);
  assert.equal(body.nisab.goldNisabTola, 7.5);
  assert.ok(
    Math.abs(body.nisab.silverNisabThreshold - (body.silver.perGram * 612.36)) < 1.0,
    'Silver Nisab threshold must equal silver price per gram * 612.36'
  );
  assert.ok(
    Math.abs(body.nisab.goldNisabThreshold - (g24 * 87.48)) < 1.0,
    'Gold Nisab threshold must equal 24K gold price per gram * 87.48'
  );
});

test('OPTIONS /api/metal-rates returns 200 with CORS headers', async () => {
  let statusCode = null;
  let headers = {};

  const mockReq = { method: 'OPTIONS' };
  const mockRes = {
    status(code) {
      statusCode = code;
      return this;
    },
    setHeader(key, val) {
      headers[key] = val;
    },
    end() {
      return this;
    }
  };

  await handler(mockReq, mockRes);
  assert.equal(statusCode, 200);
  assert.equal(headers['Access-Control-Allow-Origin'], '*');
});
