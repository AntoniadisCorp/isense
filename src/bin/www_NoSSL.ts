#!/usr/bin/env node

/**
 * Module dependencies.
 */
import https from 'http'
import serve from '../app'
import { DB } from '../db';
import { log } from '../logger/log';

// import fs from 'fs'
// import { normalize } from 'path';


// var debug = require('debug')('technica:server');

// var enforce = require('express-sslify')
// , key = fs.readFileSync('server-key.pem')
// , cert = fs.readFileSync('server-crt.pem')
// , pfx = fs.readFileSync('smartdeep.io.pfx')
/* , options = {
  key: key,
  cert: cert, */
/*   pfx,
   passphrase: 'For(Life#0)'
 
   ca: fsx.readFileSync('ca-crt.pem'),
   crl: fsx.readFileSync('ca-crl.pem'), 
   requestCert: true, 
   rejectUnauthorized: true 
}*/


// http.globalAgent.maxSockets = 100;

/**
 * Get port from environment and store in Express.
 */
const port = normalizePort(serve.PORT.toString()),
  ip = serve.IP.toString();
serve.app.set('port', port);
serve.app.set('ip', ip);


/**
 * Create HTTPS server.
 */
// for https
// serve.app.use(enforce.HTTPS({ trustProtoHeader: true }))
const server = https.createServer(/* options */serve.app)

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port, onListen);
server.on('error', onError);
server.on('listening', onListening);


// set up socket.io and bind it to our
// http server.
const io = serve.socketio
// whenever a user connects on port 3000 via
// a websocket, log that a user has connected
io(server);


/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val: string) {
  var port = parseInt(val, 10);

  if (isNaN(port)) return val // named pipe
  if (port >= 0) return port	// port number
  return false;
}

function onListen() {

  log('HTTP Server listening on %s:%s', ip, port)
  return ip
}

/**
 * Event listener for HTTP server "error" event.
 */
async function onError(error: any) {
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
    // break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
    // break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */
async function onListening() {

  let addr = server.address();
  let bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + (addr ? addr.port : null);
  try {
    await DB.connect()
  } catch (err) {
    log(`Unable to connect to Mongo!`, err);
  }
  // debug('Listening on ' + bind);
}
