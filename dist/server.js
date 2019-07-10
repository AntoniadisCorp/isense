#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Module dependencies.
 */
var app_1 = __importDefault(require("./app"));
var https_1 = __importDefault(require("https"));
var fs_1 = __importDefault(require("fs"));
// var debug = require('debug')('technica:server');
var key = fs_1.default.readFileSync('server-key.pem'), cert = fs_1.default.readFileSync('server-crt.pem'), options = {
    key: key,
    cert: cert,
};
// http.globalAgent.maxSockets = 100;
/**
 * Get port from environment and store in Express.
 */
var port = normalizePort(app_1.default.PORT.toString() || '3000'), ip = app_1.default.IP.toString();
app_1.default.app.set('port', port);
app_1.default.app.set('ip', ip);
/**
 * Create HTTPS server.
 */
var server = https_1.default.createServer(options, app_1.default.app);
/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port, function () { return ip; });
server.on('error', onError);
server.on('listening', onListening);
// set up socket.io and bind it to our
// http server.
var io = app_1.default.socketio;
// whenever a user connects on port 3000 via
// a websocket, log that a user has connected
io(server);
/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
    var port = parseInt(val, 10);
    if (isNaN(port)) {
        return val;
    } // named pipe
    if (port >= 0) {
        return port;
    } // port number
    return false;
}
/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }
    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;
    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}
/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + (addr ? addr.port : null);
    // debug('Listening on ' + bind);
}
console.log('HTTPS Server listening on %s' /* , HOST */, port);
