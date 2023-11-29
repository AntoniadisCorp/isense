import { Server, ServerOptions } from "socket.io";
import { log } from "../logger/log";
class Sockets {



    private currentPrice: number = 99;
    // @ts-ignore
    constructor(private io?: Server) {

    }
    // @ts-ignore
    attach(appio: Server) {

        this.io = appio
        // this.io.set("origins", "*:*");

        this.io.sockets.on('connection', (socket: any) => {

            log('Server Side socket connected');
            socket.emit('priceUpdate', this.currentPrice);

            socket.on('bid', (data: any) => {

                // log('socket bid/data: `, parseInt(data))
                this.currentPrice = parseInt(data);
                socket.emit('priceUpdate', this.currentPrice);
                socket.broadcast.emit('priceUpdate', this.currentPrice);
            })
        })
    }
}

export { Sockets }
