"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _1 = require(".");
var TcpSocketServer = /** @class */ (function () {
    function TcpSocketServer(svraddr, svrport) {
        var gbr = new _1.GBRoutines();
        this.svraddr = gbr.Variablevalid(svraddr) == null ? '0.0.0.0' : svraddr;
        this.svrport = gbr.Variablevalid(svrport) == null ? 8000 : svrport;
        this.sockets = [];
    }
    TcpSocketServer.prototype.TcpServer = function () {
        this.server = require('tk102');
        // start server 
        this.server.createServer({
            ip: this.svraddr,
            port: this.svrport
        });
        // incoming data, i.e. update a map 
        this.server.on('track', function (gps) {
            //updateMap (gps.geo.latitude, gps.geo.longitude);
            console.log('GPS: ', gps.geo.latitude + " " + gps.geo.longitude);
        });
        this.server.on('data', function (raw) {
            console.log('Incoming data: ' + raw);
        });
        this.server.on('listening', function (listen) {
            // listen = { port: 56751, family: 2, address: '0.0.0.0' } 
            console.log('listening from ', listen);
        });
        this.server.on('connection', function (socket) {
            console.log('Connection from ' + socket.remoteAddress);
        });
        this.server.on('disconnect', function (socket) {
            console.log('Disconnected device ' + socket.remoteAddress);
        });
        this.server.on('timeout', function (socket) {
            console.log('Time out from ' + socket.remoteAddress);
        });
        this.server.on('fail', function (err) {
            console.log(err);
        });
        this.server.on('error', function (err) {
            console.log(err);
        });
        this.server.on('log', function (name, value) {
            console.log('Event: ' + name);
            console.log(value);
        });
        /*this.server = net.createServer(function(socket) {
            var sockets = [];
            // sys.puts('Connected: ' + socket.remoteAddress + ':' + socket.remotePort);
         // socket.write('Hello ' + socket.remoteAddress + ':' + socket.remotePort + '\r\n');
            socket.write('check24800')
            socket.pipe(socket);
            sockets.push(socket);
        
             socket.on('data', function(data) {  // client writes message
                if (data == 'exit\n') {
                    // sys.puts('exit command received: ' + socket.remoteAddress + ':' + socket.remotePort + '\n');
                    socket.destroy();
                    var idx = sockets.indexOf(socket);
                    if (idx != -1) {
                        delete sockets[idx];
                    }
                    this.sockets = sockets;
                    return;
                }
                console.log(`Tcp IP Server side Received from Client: ${data}`)
                 var len = sockets.length;
                for (var i = 0; i < len; i ++) { // broad cast
                    if (sockets[i] != socket) {
                        if (sockets[i]) {
                            console.log('broadcast')
                            sockets[i].write(socket.remoteAddress + ':' + socket.remotePort + ':' + data);
                        }
                    }
                }
                this.sockets = sockets;
            });
             socket.on('end', function() { // client disconnects
                // sys.puts('Disconnected: ' + data + data.remoteAddress + ':' + data.remotePort + '\n');
                var idx = sockets.indexOf(socket);
                if (idx != -1) {
                    delete sockets[idx];
                }
                this.sockets = sockets;
            });
        })
         this.server.listen(svrport, svraddr);*/
        // sys.puts('Server Created at ' + svraddr + ':' + svrport + '\n');
    };
    return TcpSocketServer;
}());
exports.default = new TcpSocketServer();
