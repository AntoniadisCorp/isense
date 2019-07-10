/*
In the node.js intro tutorial (http://nodejs.org/), they show a basic tcp 
server, but for some reason omit a client connecting to it.  I added an 
example at the bottom.
Save the following server in example.js:
*/
// var sys = require('sys')
import net = require('net')
import { GBRoutines } from '.'

class TcpSocketServer {

    // SERVER ADRESS
    private svraddr: string | undefined
    // SERVER PORT
    private svrport: number | undefined

    // List Array
    private sockets: Array<any>
    private server: any

    constructor (svraddr?: string, svrport?: number) {

        let gbr: GBRoutines = new GBRoutines()

        this.svraddr = gbr.Variablevalid(svraddr) == null? '0.0.0.0' : svraddr
        this.svrport = gbr.Variablevalid(svrport) == null? 8000 : svrport
        this.sockets = [];

    }

    TcpServer(): void {

        this.server = require('tk102')
        // start server 
        this.server.createServer({

            ip: this.svraddr,
            port: this.svrport
        });

        // incoming data, i.e. update a map 
        this.server.on('track', (gps:any) => {
            //updateMap (gps.geo.latitude, gps.geo.longitude);
            console.log('GPS: ', `${gps.geo.latitude} ${gps.geo.longitude}`);
        });

        this.server.on('data', (raw:any) => {
            console.log('Incoming data: ' + raw);
        });

        this.server.on('listening', (listen: any) => {
            // listen = { port: 56751, family: 2, address: '0.0.0.0' } 
            console.log('listening from ', listen);
        });

        this.server.on('connection', (socket:any) => {
            console.log('Connection from ' + socket.remoteAddress);
        });

        this.server.on('disconnect', (socket:any) => {
            console.log('Disconnected device ' + socket.remoteAddress);
        });

        this.server.on('timeout', (socket:any) => {
            console.log('Time out from ' + socket.remoteAddress);
        });
        this.server.on('fail', (err:any) => {
            console.log(err);
        });

        this.server.on('error', (err:any) => {
            console.log(err);
        });

        this.server.on('log', (name:any, value:any) => {
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
    }


}

export default new TcpSocketServer()