#!/usr/bin/env node

const { getStatus, startWebServer } = require('./index.js');

const args = process.argv.slice(2);

if (args[0] === 'check' && args[1]) {
  getStatus(args[1])
    .then(status => {
      console.log(JSON.stringify(status, null, 2));
    })
    .catch(err => {
      console.error('Error:', err.message);
      process.exit(1);
    });
} else if (args[0] === 'start') {
  startWebServer({ port: 3000 })
    .then(server => {
      console.log(`✅ Web UI running at http://localhost:${server.port}`);
    })
    .catch(err => {
      console.error('❌ Failed to start web server:', err.message);
      process.exit(1);
    });
} else {
  console.log(`
Usage:
  npx vyzenix-mcstatus check <host>
  npx vyzenix-mcstatus start

Examples:
  npx vyzenix-mcstatus check mc.hypixel.net
  npx vyzenix-mcstatus start
  `);
}
