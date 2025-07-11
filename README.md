# Vyzenix-McStatus

![Minecraft Server Status](https://img.shields.io/badge/Minecraft-Server%2520Status-brightgreen)
![Node.js ≥14.0](https://img.shields.io/badge/Node.js-%E2%89%A514.0-blue)
![License](https://img.shields.io/badge/License-CUSTOM-blue)

**Vyzenix-McStatus** is a robust Node.js package for checking Minecraft server status with a beautiful web interface, RESTful JSON API, CLI, real-time updates, and advanced MOTD formatting. Fast, reliable, and packed with features for both players and server admins.

---

## 🚩 Features

- 🔗 Real-time Minecraft server status
- 🌐 Modern Web Interface & RESTful API
- 🖥️ CLI tool for quick server checks
- 🎨 MOTD color & style rendering (text & HTML)
- 🧭 SRV record & DNS resolution
- ♻️ Auto-retry & full error handling
- ⚙️ Highly customizable web server
- 🔒 Production-ready and fully documented

---

## 📦 Installation

```bash
npm install vyzenix-mcstatus
```

---

## ⚡ Quick Start

### As a Node.js Module

```js
const { getStatus, startWebServer } = require('vyzenix-mcstatus');

(async () => {
  try {
    const status = await getStatus('mc.hypixel.net');
    console.log('Server Status:', status);
  } catch (err) {
    console.error('Error:', err.message);
  }

  const server = await startWebServer({ port: 3000 });
  console.log(`Web interface running at http://localhost:${server.port}`);
})();
```

---

### As CLI Tool

```bash
npx vyzenix-mcstatus check mc.hypixel.net
npx vyzenix-mcstatus serve --port 3000
```

---

## 🌐 Web Interface

**Start the web server:**

```js
const { startWebServer } = require('vyzenix-mcstatus');

startWebServer({
  port: 3000,
  cacheDuration: 60,
  enableSRV: true
}).then(server => {
  console.log(`Server running on port ${server.port}`);
});
```

#### Endpoints

| Endpoint                   | Description            |
| -------------------------- | ---------------------- |
| `/`                        | Main web interface     |
| `/status/:host/:port?`     | Rendered server status |
| `/api/status/:host/:port?` | JSON API response      |

---

## 📚 API Documentation

### `getStatus(host, [port], [timeout])`

#### Parameters

- `host` (string): Minecraft server hostname or IP
- `port` (number, optional): default = 25565
- `timeout` (number, optional): default = 5000 ms

#### Returns

```json
{
  "online": true,
  "host": "mc.hypixel.net",
  "ip": "192.168.1.1",
  "port": 25565,
  "motd": {
    "text": "§aHypixel Network §c[1.8-1.21]",
    "html": "<span class=\"mc-green\">Hypixel Network </span><span class=\"mc-red\">[1.8-1.21]</span>",
    "raw": {}
  },
  "players": {
    "online": 45231,
    "max": 200000,
    "sample": []
  },
  "version": "Requires MC 1.8 / 1.21",
  "protocol": 47,
  "ping": 103,
  "favicon": "data:image/png;base64,...",
  "mods": null,
  "forgeData": null,
  "raw": {}
}
```

---

## 🏗️ MinecraftClient Class

### Constructor Options

```js
{
  host: String,
  port: Number,
  timeout: Number,
  protocolVersion: Number,
  enableSRV: Boolean,
  maxRetries: Number,
  retryDelay: Number
}
```

### Methods

- `getStatus()` – Fetches server status
- `resolveHost()` – Resolves DNS & SRV
- `parseMOTD(desc)` – Formats raw MOTD to text and HTML

---

## 🛡️ Error Handling

Catch and handle specific error types:

```js
const { getStatus, errors } = require('vyzenix-mcstatus');

try {
  const status = await getStatus('example.com');
} catch (err) {
  if (err instanceof errors.TimeoutError) {
    console.log('Server is not responding');
  } else if (err instanceof errors.DNSError) {
    console.log('Invalid DNS or hostname');
  } else {
    console.log('Unknown error:', err.message);
  }
}
```

**Available Error Classes:**

- `MinecraftError`
- `TimeoutError`
- `ProtocolError`
- `DNSError`

---

## 🖥️ Example: Custom Web Server with Views & Static Assets

```js
const { startWebServer } = require('vyzenix-mcstatus');
const path = require('path');

startWebServer({
  port: 3000,
  views: path.join(__dirname, 'views'),
  static: path.join(__dirname, 'public')
}).then(() => {
  console.log('Web server started on http://localhost:3000');
});
```

---

## 🚀 Deployment & Hosting

### Localhost

```bash
node server.js
```
Visit: `http://localhost:3000`

---

### VPS / Linux (with PM2)

```bash
npm install -g pm2
# Create server.js:
```
```js
const { startWebServer } = require('./index'); // or 'vyzenix-mcstatus' if installed globally

startWebServer({
  port: 3000,
  cacheDuration: 60,
  enableSRV: true
}).then(server => {
  console.log(`🌐 Web server running on http://localhost:${server.port}`);
}).catch(console.error);
```
```bash
pm2 start server.js --name vyzenix-mcstatus
pm2 save
pm2 startup
```

---

### Free Hosting Platforms

- [Railway](https://railway.app)
- [Render](https://render.com)
- [Replit](https://replit.com)
- [Glitch](https://glitch.com)

---

## 🧑‍💻 Development Setup

```bash
git clone https://github.com/vanshzexe/vyzenix-mcstatus.git
cd vyzenix-mcstatus
npm install
npm start
```

Or use CLI:

```bash
npx vyzenix-mcstatus start
npx vyzenix-mcstatus check mc.example.com
```

---

## 📜 License

This project is licensed under a **CUSTOM LICENSE**.  
See [`LICENSE.txt`](LICENSE.txt) for full terms.

---

## 💚 Author

Developed with 💻 by [@vanshzexe](https://github.com/vanshzexe)

---
