class Protocol {
    static readVarInt(buffer, offset = 0) {
        let result = 0;
        let shift = 0;
        let bytes = 0;
        
        while (true) {
            if (offset + bytes >= buffer.length) {
                throw new Error('Buffer too short for VarInt');
            }
            const byte = buffer.readUInt8(offset + bytes);
            result |= (byte & 0x7F) << shift;
            bytes++;
            if ((byte & 0x80) === 0) break;
            shift += 7;
            if (shift >= 32) {
                throw new Error('VarInt too large');
            }
        }
        return { value: result, size: bytes };
    }

    static writeVarInt(value) {
        value = value >>> 0;
        const bytes = [];
        do {
            let byte = value & 0x7F;
            value >>>= 7;
            if (value !== 0) byte |= 0x80;
            bytes.push(byte);
        } while (value !== 0);
        return Buffer.from(bytes);
    }

    static writeString(str) {
        const strBuf = Buffer.from(str, 'utf8');
        const lenBuf = this.writeVarInt(strBuf.length);
        return Buffer.concat([lenBuf, strBuf]);
    }

    static writeUShort(value) {
        const buf = Buffer.alloc(2);
        buf.writeUInt16BE(value);
        return buf;
    }
}

module.exports = Protocol;