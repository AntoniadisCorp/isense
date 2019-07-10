class Sockets {

    private io: any
    private currentPrice: number = 99;

    constructor () {}

    attach (appio:any) {

        this.io = appio
        this.io.set("origins", "*:*");

        this.io.sockets.on('connection', (socket: any) => {

            console.log('Server Side socket connected');
            socket.emit('priceUpdate', this.currentPrice);

            socket.on('bid', (data:any) => {

                this.currentPrice = parseInt(data);
                socket.emit('priceUpdate', this.currentPrice);
                socket.broadcast.emit('priceUpdate', this.currentPrice);
            })
        })
    }
}

export { Sockets }
