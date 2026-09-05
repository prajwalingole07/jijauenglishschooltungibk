// JIJAU SCHOOL CONNECT PORTAL - Production Server
// Warm Sunset Glass / Peach Horizon Light Theme
const { createServer } = require('http');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, dir: './' });
const handle = app.getRequestHandler();
const port = parseInt(process.env.PORT, 10) || 3000;

app.prepare().then(() => {
  createServer((req, res) => handle(req, res)).listen(port, (err) => {
    if (err) throw err;
    console.log(`\n  JIJAU ENGLISH SCHOOL - CONNECT PORTAL`);
    console.log(`  Warm Sunset Glass / Peach Horizon`);
    console.log(`  > Ready on http://localhost:${port}`);
    console.log(`  > Press Ctrl+C to stop\n`);
  });
});
