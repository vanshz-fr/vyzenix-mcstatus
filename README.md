# Minecraft Status

A Node.js package to check Minecraft server status, similar to mcstatus.io.

## Installation

```bash
npm install yesmcstatus2.1
```

## Usage

### Basic Usage

```javascript
const { getStatus } = require('yesmcstatus2.1');

// Check server status
getStatus('mc.hypixel.net')
  .then(status => console.log(status))
  .catch(err => console.error(err));
```

### Advanced Usage

```javascript
const { MinecraftClient } = require('yesmcstatus2.1');

// Create client with options
const client = new MinecraftClient({
  host: 'mc.hypixel.net',
  port: 25565,
  timeout: 3000,
  protocolVersion: -1 // -1 for auto
});

// Get status
client.getStatus()
  .then(status => {
    console.log('Server MOTD:', status.motd);
    console.log('Players:', status.players.online);
  })
  .catch(err => console.error(err));
```

### Error Handling

```javascript
const { getStatus, errors } = require('yesmcstatus2.1');

getStatus('invalid.server')
  .catch(err => {
    if (err instanceof errors.TimeoutError) {
      console.log('Server is offline or not responding');
    } else {
      console.log('Error:', err.message);
    }
  });
```

## API

### getStatus(host, [port], [timeout])
Returns a promise with server status.

### MinecraftClient(options)
Class for more control over the connection.

### Errors
- `MinecraftError` - Base error class
- `TimeoutError` - Connection timeout
- `ProtocolError` - Protocol parsing error

## Response Format

```javascript
{
  online: boolean,
  host: string,
  ip: string,
  port: number,
  motd: string,
  players: {
    online: number,
    max: number,
    sample: Array<{ name: string, id: string }>
  },
  version: string,
  protocol: number,
  ping: number,
  favicon: string | null,
  raw: Object // Raw server response
}
```

## License

CUSTOM LICENSE"# YesMcStatus2.1" 
