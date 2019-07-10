"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Sockets = /** @class */ (function () {
    function Sockets() {
        this.currentPrice = 99;
    }
    Sockets.prototype.attach = function (appio) {
        var _this = this;
        this.io = appio;
        this.io.set("origins", "*:*");
        this.io.sockets.on('connection', function (socket) {
            console.log('Server Side socket connected');
            socket.emit('priceUpdate', _this.currentPrice);
            socket.on('bid', function (data) {
                _this.currentPrice = parseInt(data);
                socket.emit('priceUpdate', _this.currentPrice);
                socket.broadcast.emit('priceUpdate', _this.currentPrice);
            });
        });
    };
    return Sockets;
}());
exports.Sockets = Sockets;
