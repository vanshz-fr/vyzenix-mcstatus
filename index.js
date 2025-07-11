// index.js
const MinecraftClient = require('./lib/client');
const MinecraftStatusServer = require('./web/server');

/**
 * Get Minecraft server status
 * @param {string} host - Server hostname or IP
 * @param {number} [port=25565] - Server port
 * @param {number} [timeout=5000] - Connection timeout in ms
 * @returns {Promise<Object>} Server status
 */
async function getStatus(host, port = 25565, timeout = 5000) {
    const client = new MinecraftClient({ host, port, timeout });
    return client.getStatus();
}

/**
 * Start the web interface
 * @param {Object} [options] - Server options
 * @param {number} [options.port=3000] - Web server port
 * @param {number} [options.cacheDuration=60] - Cache duration in seconds
 * @returns {Promise<MinecraftStatusServer>} The server instance
 */
async function startWebServer(options = {}) {
    const server = new MinecraftStatusServer(options);
    await server.start();
    return server;
}

module.exports = {
    MinecraftClient,
    getStatus,
    startWebServer,
    errors: require('./lib/errors')
};