import http from 'node:http';
import { handler } from './build/handler.js';
import injectSocketIO from './socketIoHandler.ts';

const PORT = 3000;

const server = http.createServer(handler);

injectSocketIO(server);

server.listen(PORT, () => {
    console.log(`Listening on http://0.0.0.0:${PORT}`);
});
