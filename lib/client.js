const net = require('net');
const { Resolver } = require('dns').promises;
const Protocol = require('./protocol');
const { MinecraftError, TimeoutError, ProtocolError } = require('./errors');
const EventEmitter = require('events');

class MinecraftClient extends EventEmitter {
    constructor(options = {}) {
        super();
        this.config = {
            host: options.host || 'localhost',
            port: options.port || 25565,
            timeout: options.timeout || 5000,
            protocolVersion: options.protocolVersion || -1,
            enableSRV: options.enableSRV !== false,
            maxRetries: options.maxRetries || 1,
            retryDelay: options.retryDelay || 1000
        };
        this.attempts = 0;
        this.cache = {
            dns: null,
            lastUpdated: 0,
            ttl: 30000 // 30 seconds cache
        };
    }

    async resolveHost() {
        const now = Date.now();
        if (this.cache.dns && now - this.cache.lastUpdated < this.cache.ttl) {
            return this.cache.dns;
        }

        try {
            const resolver = new Resolver();
            let result = null;
            
            if (this.config.enableSRV) {
                try {
                    const srvRecords = await resolver.resolve(`_minecraft._tcp.${this.config.host}`, 'SRV');
                    if (srvRecords?.length > 0) {
                        this.config.port = srvRecords[0].port;
                        result = srvRecords[0].name;
                    }
                } catch (err) {
                    this.emit('debug', `SRV lookup failed: ${err.message}`);
                }
            }
            
            if (!result) {
                const records = await resolver.resolve4(this.config.host);
                result = records[0];
            }

            this.cache = {
                dns: result,
                lastUpdated: now,
                ttl: this.cache.ttl
            };
            return result;
        } catch (err) {
            throw new MinecraftError(`DNS resolution failed: ${err.message}`);
        }
    }

    createHandshakePacket() {
        const packetData = Buffer.concat([
            Protocol.writeVarInt(this.config.protocolVersion),
            Protocol.writeString(this.config.host),
            Protocol.writeUShort(this.config.port),
            Buffer.from([0x01]) // Next state (1 for status)
        ]);
        
        return Buffer.concat([
            Protocol.writeVarInt(1 + packetData.length), // Packet ID (0x00) + data
            Buffer.from([0x00]), // Packet ID for handshake
            packetData
        ]);
    }

    createRequestPacket() {
        return Buffer.from([0x01, 0x00]); // Status request packet
    }

    parseMOTD(desc) {
        if (!desc) return { 
            text: 'No MOTD', 
            html: '<span class="mc-white">No MOTD</span>', 
            raw: desc 
        };

        const processComponent = (component, isRoot = false) => {
            const text = component.text || '';
            const color = component.color || (isRoot ? 'white' : null);
            const formats = [
                component.bold ? 'mc-bold' : '',
                component.italic ? 'mc-italic' : '',
                component.underlined ? 'mc-underlined' : '',
                component.strikethrough ? 'mc-strikethrough' : '',
                component.obfuscated ? 'mc-obfuscated' : ''
            ].filter(Boolean).join(' ');

            const colorClass = color ? `mc-${color.replace(/_/g, '-')}` : '';
            const classes = [colorClass, formats].filter(Boolean).join(' ');

            return {
                text,
                html: `<span class="${classes}">${this.escapeHTML(text)}</span>`,
                raw: component
            };
        };

        // String MOTD
        if (typeof desc === 'string') {
            return {
                text: desc,
                html: `<span class="mc-white">${this.escapeHTML(desc)}</span>`,
                raw: desc
            };
        }

        // Single component MOTD
        if (desc.text && !desc.extra) {
            return processComponent(desc, true);
        }

        // Complex MOTD with multiple components
        if (Array.isArray(desc.extra)) {
            const parts = desc.extra.map(comp => processComponent(comp));
            return {
                text: parts.map(p => p.text).join(''),
                html: parts.map(p => p.html).join(''),
                raw: desc
            };
        }

        // Fallback for unknown format
        return {
            text: JSON.stringify(desc),
            html: `<span class="mc-white">${this.escapeHTML(JSON.stringify(desc))}</span>`,
            raw: desc
        };
    }

    async establishConnection(ip) {
        return new Promise((resolve, reject) => {
            const socket = net.createConnection({ 
                host: ip, 
                port: this.config.port 
            }, () => resolve(socket));

            socket.on('error', reject);
            socket.setTimeout(this.config.timeout, () => {
                socket.destroy();
                reject(new TimeoutError());
            });
        });
    }

    async exchangePackets(socket) {
        return new Promise((resolve, reject) => {
            let buffer = Buffer.alloc(0);
            const startTime = Date.now();

            const timeoutId = setTimeout(() => {
                socket.destroy();
                reject(new TimeoutError('Packet exchange timed out'));
            }, this.config.timeout);

            const cleanup = () => {
                clearTimeout(timeoutId);
                socket.removeAllListeners();
            };

            socket.on('data', data => {
                buffer = Buffer.concat([buffer, data]);
                
                try {
                    const { value: packetLength, size: lengthSize } = Protocol.readVarInt(buffer);
                    if (buffer.length < lengthSize + packetLength) return;

                    const { value: packetId, size: idSize } = Protocol.readVarInt(buffer, lengthSize);
                    if (packetId !== 0x00) {
                        throw new ProtocolError(`Unexpected packet ID: ${packetId}`);
                    }

                    const { value: jsonLength, size: jsonLengthSize } = 
                        Protocol.readVarInt(buffer, lengthSize + idSize);
                    
                    const jsonStart = lengthSize + idSize + jsonLengthSize;
                    if (buffer.length < jsonStart + jsonLength) return;

                    const jsonString = buffer.toString('utf8', jsonStart, jsonStart + jsonLength);
                    const json = JSON.parse(jsonString);

                    cleanup();
                    socket.end();

                    resolve({
                        json,
                        ping: Date.now() - startTime
                    });
                } catch (err) {
                    cleanup();
                    socket.destroy();
                    reject(new ProtocolError(`Failed to parse response: ${err.message}`));
                }
            });

            socket.on('error', err => {
                cleanup();
                reject(new MinecraftError(`Socket error: ${err.message}`));
            });

            socket.on('close', () => {
                cleanup();
            });
        });
    }

    async getStatus() {
        this.attempts = 0;
        this.emit('debug', 'Starting status check');

        while (this.attempts < this.config.maxRetries) {
            this.attempts++;
            let socket = null;

            try {
                const ip = await this.resolveHost();
                this.emit('debug', `Resolved IP: ${ip}`);

                socket = await this.establishConnection(ip);
                this.emit('debug', 'Connection established');

                socket.write(this.createHandshakePacket());
                socket.write(this.createRequestPacket());
                this.emit('debug', 'Packets sent');

                const { json, ping } = await this.exchangePackets(socket);
                this.emit('debug', 'Response received');

                const motd = this.parseMOTD(json.description);
                this.emit('debug', 'MOTD parsed');

                return {
                    online: true,
                    host: this.config.host,
                    ip,
                    port: this.config.port,
                    motd,
                    players: {
                        online: json.players?.online || 0,
                        max: json.players?.max || 0,
                        sample: json.players?.sample || []
                    },
                    version: json.version?.name || 'Unknown',
                    protocol: json.version?.protocol || -1,
                    ping,
                    favicon: json.favicon || null,
                    mods: json.mods || null,
                    forgeData: json.forgeData || null,
                    raw: json
                };
            } catch (err) {
                this.emit('error', err);
                if (socket) socket.destroy();

                if (this.attempts < this.config.maxRetries) {
                    this.emit('debug', `Retrying in ${this.config.retryDelay}ms...`);
                    await new Promise(res => setTimeout(res, this.config.retryDelay));
                    continue;
                }

                return {
                    online: false,
                    host: this.config.host,
                    error: err.message,
                    raw: null
                };
            }
        }
    }

    escapeHTML(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag]));
    }
}

module.exports = MinecraftClient;