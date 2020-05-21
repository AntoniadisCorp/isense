class Sockets {


    private currentPrice: number = 99;

    constructor(private io?: SocketIO.Server) { }

    attach(appio: SocketIO.Server) {

        this.io = appio
        // this.io.set("origins", "*:*");

        this.io.sockets.on('connection', (socket: any) => {

            console.log('Server Side socket connected');
            socket.emit('priceUpdate', this.currentPrice);

            socket.on('bid', (data: any) => {

                // console.log(`socket bid/data: `, parseInt(data))
                this.currentPrice = parseInt(data);
                socket.emit('priceUpdate', this.currentPrice);
                socket.broadcast.emit('priceUpdate', this.currentPrice);
            })
        })
    }
}

export { Sockets }
