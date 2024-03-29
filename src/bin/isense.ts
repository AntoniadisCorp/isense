#!/usr/bin/env node

/**
 * Module dependencies.
 */
import serve from '../app'
// import https, { Server } from 'https'
// import spdy from 'spdy';
import http2 from 'http2';
import fs from 'fs'
import path, { normalize } from 'path';
import { DB } from '../db';
import { log } from '../logger/log';
import { config } from 'dotenv';

// var debug = require('debug')('technica:server');

config(/* { path: path.resolve(process.cwd(), '.env') } */)
/* type Protocol =
  | "h2"
  | "spdy/3.1"
  | "spdy/3"
  | "spdy/2"
  | "http/1.1"
  | "http/1.0"; */

// let protocols: Protocol[] = ['h2', 'spdy/3.1', 'http/1.1']
let enforce = require('express-sslify')
  , key = fs.readFileSync('server.key')
  , cert = fs.readFileSync('server.crt')
  // , pfx = fs.readFileSync('smartdeep.io.pfx')
  , options = {
    key: key,
    cert: cert,
    allowHTTP1: true
    /*   pfx,
       passphrase: 'For(Life#0)'
     
       ca: fsx.readFileSync('ca-crt.pem'),
       crl: fsx.readFileSync('ca-crl.pem'), 
       requestCert: true, 
       rejectUnauthorized: true */
  }


// http.globalAgent.maxSockets = 100;

/**
 * Get port from environment and store in Express.
 */
var port = normalizePort(serve.PORT.toString()),
  ip = serve.IP.toString();
serve.app.set('port', port);
serve.app.set('ip', ip);



/**
 * Create HTTPS server.
 */
// for https
serve.app.use(enforce.HTTPS({ trustProtoHeader: true }))
let server: any = http2.createSecureServer(options, serve.app);

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port, onListen);
server.on('error', onError);
server.on('listening', onListening);



// set up socket.io and bind it to our
// http server.
let io = serve.socketio
// whenever a user connects on port 3000 via
// a websocket, log that a user has connected
io(server);



/**
 * Event listener for HTTP server "listening" event.
 */
async function onListening() {

  let addr = server.address();
  let bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + (addr ? addr.port : null);
  try {
    await DB.connect();
  } catch (err) {
    log(`Unable to connect to Mongo!`, err);
  }
  // debug('Listening on ' + bind);
}

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val: string) {
  var port = parseInt(val, 10);

  if (isNaN(port)) { return val; }	// named pipe
  if (port >= 0) { return port; }	// port number
  return false;
}

function onListen() {

  log('Server Running on %s:%s', ip, port)
  return ip
}

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error: any) {
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
log('HTTPS Server listening on %s'/* , HOST */, port)
