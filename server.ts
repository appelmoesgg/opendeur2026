/**
 * Production entry point.
 * Run after building: bun server.ts
 *
 * We can't rely on the Vite dev-server plugin (webSocket.ts) in production,
 * so we create our own HTTP server, attach the SvelteKit handler to it,
 * and then inject Socket.IO on the same server instance.
 */

import http from 'node:http';
import { handler } from './build/handler.js';
import injectSocketIO from './socketIoHandler.ts';

const PORT = 3000;

const server = http.createServer(handler);

injectSocketIO(server);

server.listen(PORT, () => {
    console.log(`Listening on http://0.0.0.0:${PORT}`);
});
