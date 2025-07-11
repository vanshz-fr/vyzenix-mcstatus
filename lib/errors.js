class MinecraftError extends Error {
    constructor(message) {
        super(message);
        this.name = 'MinecraftError';
    }
}

class TimeoutError extends MinecraftError {
    constructor() {
        super('Connection timeout');
        this.name = 'TimeoutError';
    }
}

class ProtocolError extends MinecraftError {
    constructor(message) {
        super(message);
        this.name = 'ProtocolError';
    }
}

module.exports = {
    MinecraftError,
    TimeoutError,
    ProtocolError
};