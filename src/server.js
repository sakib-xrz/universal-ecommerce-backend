const app = require('./app.js');
const config = require('./config/index.js');
const { createServer } = require('http');
const { initSocket } = require('./config/socket.js');

process.on('uncaughtException', err => {
    console.error(err);
    process.exit(1);
});

let server;

async function startServer() {
    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize Socket.io
    initSocket(httpServer);

    server = httpServer.listen(config.port, () => {
        console.log(`🎯 Server listening on port: ${config.port}`);
        console.log(
            `🔌 Socket.io initialized and ready for connections`
        );
    });

    process.on('unhandledRejection', error => {
        if (server) {
            server.close(() => {
                console.log(error);
                process.exit(1);
            });
        } else {
            process.exit(1);
        }
    });
}

process.on('SIGTERM', () => {
    console.log('SIGTERM received');
    if (server) {
        server.close();
    }
});

startServer();
