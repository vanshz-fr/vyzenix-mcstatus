const express = require('express');
const path = require('path');

module.exports = class MinecraftStatusServer {
    constructor(options = {}) {
        this.app = express();
        this.port = options.port || 3000;
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        this.app.set('view engine', 'ejs');
        this.app.set('views', path.join(__dirname, 'views'));
        this.app.use(express.static(path.join(__dirname, 'public')));
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
    }

    setupRoutes() {
        // Home page
        this.app.get('/', (req, res) => {
            res.render('index', { 
                title: 'Minecraft Server Status Checker',
                error: null,
                status: null
            });
        });

        // ✅ POST route used by frontend JS (app.js)
        this.app.post('/api/status', async (req, res) => {
            try {
                const { host, port } = req.body;
                const { getStatus } = require('../index');
                const status = await getStatus(
                    host,
                    port ? parseInt(port) : 25565
                );
                res.json(status);
            } catch (err) {
                console.error('POST /api/status error:', err);
                res.status(500).json({
                    online: false,
                    error: err.message
                });
            }
        });

        // API: GET status via URL
        this.app.get('/api/status/:host/:port?', async (req, res) => {
            try {
                const { getStatus } = require('../index');
                const status = await getStatus(
                    req.params.host,
                    req.params.port ? parseInt(req.params.port) : 25565
                );
                res.json(status);
            } catch (err) {
                console.error('GET /api/status error:', err);
                res.status(500).json({ 
                    online: false,
                    error: err.message 
                });
            }
        });

        // Render server status page
        this.app.get('/status/:host/:port?', async (req, res) => {
            try {
                const { getStatus } = require('../index');
                const status = await getStatus(
                    req.params.host,
                    req.params.port ? parseInt(req.params.port) : 25565
                );
                res.render('status', { 
                    title: `${req.params.host} Status`,
                    status,
                    host: req.params.host,
                    port: req.params.port || 25565
                });
            } catch (err) {
                console.error('GET /status error:', err);
                res.render('error', { 
                    title: 'Error',
                    error: err.message,
                    host: req.params.host,
                    port: req.params.port || 25565
                });
            }
        });
    }

    async start() {
        return new Promise((resolve) => {
            this.server = this.app.listen(this.port, () => {
                console.log(`✅ Web server running at: http://localhost:${this.port}`);
                resolve(this);
            });
        });
    }

    async stop() {
        return new Promise((resolve) => {
            this.server.close(() => {
                console.log('❌ Server stopped');
                resolve();
            });
        });
    }
};
