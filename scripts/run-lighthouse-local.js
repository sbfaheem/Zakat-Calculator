const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 4173;
const ROOT = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';

  const filePath = path.join(ROOT, reqPath);
  const ext = path.extname(filePath).toLowerCase();

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Local test server listening at http://127.0.0.1:${PORT}`);
  console.log('Spawning Lighthouse in child process...');

  const args = [
    'lighthouse',
    `http://127.0.0.1:${PORT}`,
    '--chrome-flags=--headless --no-sandbox --disable-gpu',
    '--output=json',
    '--output-path=' + path.join(ROOT, 'lighthouse-local.json'),
    '--only-categories=accessibility,seo,performance',
    '--quiet'
  ];

  const lh = spawn('npx.cmd', args, {
    cwd: ROOT,
    shell: true,
    stdio: 'inherit'
  });

  lh.on('close', (code) => {
    console.log(`Lighthouse exited with code ${code}`);
    try {
      const reportFile = path.join(ROOT, 'lighthouse-local.json');
      if (fs.existsSync(reportFile)) {
        const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
        console.log('\n==========================================');
        console.log('   LOCAL LIGHTHOUSE AUDIT RESULTS');
        console.log('==========================================');
        const cats = report.categories;
        for (const key of ['accessibility', 'seo', 'performance']) {
          if (cats[key]) {
            console.log(`${cats[key].title}: ${Math.round(cats[key].score * 100)} / 100`);
          }
        }
        console.log('==========================================\n');
      }
    } catch (e) {
      console.error('Failed to parse report:', e);
    } finally {
      server.close();
      process.exit(0);
    }
  });

  lh.on('error', (err) => {
    console.error('Spawn error:', err);
    server.close();
    process.exit(1);
  });
});
