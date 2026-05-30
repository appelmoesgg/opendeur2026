import injectSocketIO from './socketIoHandler.ts';

export const webSocketServer = {
    name: 'webSocketServer',
    configureServer(server: any) {
        injectSocketIO(server.httpServer);
    }
};
