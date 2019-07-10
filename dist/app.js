"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var serve_favicon_1 = __importDefault(require("serve-favicon"));
var path_1 = __importDefault(require("path"));
var socket_io_1 = __importDefault(require("socket.io"));
// GLOBAL FUNCTIONS
var global_1 = require("./global");
// APP ROUTES
var routes_1 = require("./routes");
// store session state in browser cookie, keep logged in user if exist from browser or server stopped
var cookie_session_1 = __importDefault(require("cookie-session"));
var cookie_parser_1 = __importDefault(require("cookie-parser"));
var body_parser_1 = __importDefault(require("body-parser"));
// Configuring Passport
var passport_1 = __importDefault(require("passport"));
var express_session_1 = __importDefault(require("express-session"));
// , flash    = require('connect-flash')
// , HOST = 'localhost' //prokopis.hopto.org
var Server = /** @class */ (function () {
    // CONSTRUCTOR CLASS
    function Server() {
        // SERVER LISTEN PORTS
        this.PORT = 3000;
        //create classes routes, routines
        this.gbObject = new global_1.GBRoutines();
        this.routeObject = new routes_1.mainRouter();
        this.taskObject = new routes_1.Tasks();
        // set Routines Adresses Objects and Server Port
        this.env = process.env.NODE_ENV || 'production';
        this.app = express_1.default();
        this.socketio = this.sockattach;
        this.sessionOptions = {
            secret: this.gbObject.generateUUID('timestamp'),
            resave: true,
            saveUninitialized: true,
            cookie: { secure: true },
            cookieName: '__UD',
            duration: 30 * 60 * 1000,
            activeDuration: 5 * 60 * 1000,
            secure: true,
            ephemeral: true
        };
        // this.PORT = 'production' == this.env ? process.env.OPENSHIFT_NODEJS_PORT || this.PORT : this.PORT
        this.PORT = process.env.OPENSHIFT_NODEJS_PORT || this.PORT;
        this.IP = process.env.OPENSHIFT_NODEJS_IP || 'localhost';
        this.mainServe();
    }
    // USE SOCKET IO
    Server.prototype.sockattach = function (server) {
        var socketObject = new global_1.Sockets();
        socketObject.attach(socket_io_1.default.listen(server));
    };
    Server.prototype.mainServe = function () {
        // View Engine
        this.app.use(serve_favicon_1.default(path_1.default.join(__dirname + '/favicon.ico')));
        // Set Static Folder dist production
        this.app.use(express_1.default.static(path_1.default.join(__dirname + '/dist')));
        this.app.set('views', express_1.default.static(path_1.default.join(__dirname + '/views')));
        // this.app.use('/scripts', express.static(fpath.join(__dirname + '/public/node_modules')))
        // this.app.set('view engine', 'ejs')
        // app.engine('html', require('ejs').renderFile)
        // cookieParser
        this.app.use(cookie_parser_1.default());
        // Body Parser MW
        this.app.use(body_parser_1.default.json({ limit: '2mb' }));
        this.app.use(body_parser_1.default.urlencoded({ limit: '2mb', extended: false }));
        // Cookie Session
        this.app.use(cookie_session_1.default({
            keys: ['Pame sta aperathou aurio?', 'Nai kai olo to kalokairi@@@'],
            secret: 'tobo!',
            maxAge: 60 * 60 * 1000,
        }));
        // set Headers and methods
        this.app.use(function (req, res, next) {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-Auth-Token');
            res.header('Access-Control-Allow-Methods', 'OPTIONS, GET, PATCH, POST, PUT, DELETE');
            if ('OPTIONS' == req.method) {
                res.sendStatus(200);
            }
            else {
                console.log(req.ip + " " + req.method + " " + req.url);
                next();
            }
        });
        /* this.app.all('*',  (req:Request, res:Response, next: NextFunction) => {

            var schema = (req.headers['x-forwarded-proto'] || 'none');
            
            if ( req.hostname != 'localhost' && schema != 'https' ) {
        
                res.set('x-forwarded-proto', 'https');
                // res.redirect('https://' + req.get('host') + req.url);
        
            } else {
                // Use res.sendFile, as it streams instead of reading the file into memory.
                // res.sendFile(fpath.join(__dirname + '/public/dist/ind.html'))
            }
            // Cookies that have not been signed
            console.log('----> New User connected ' + `https://${req.headers.host}${req.url}`)
        
            console.log('DATE: ' + new Date()+' '+req.connection.remoteAddress +' '+req.method+' '+req.url+' ');
            // Cookies that have not been signed
            console.log('Cookies: ', req.cookies)
        
            // Cookies that have been signed
            console.log('Signed Cookies: ', req.signedCookies)
            console.log('session Cookies: ', req.session)
        
            
        })
 */
        // USE ROUTES
        this.app.use('/', this.routeObject.router);
        this.app.use('/task', this.taskObject.router);
        // SET PASSPORT AND SESSION OPTIONS
        this.app.use(express_session_1.default(this.sessionOptions));
        this.app.use(passport_1.default.initialize());
        this.app.use(passport_1.default.session());
        // // will print stacktrace
        /* if (this.app.get('env') === 'development') {

            this.app.use( (err: any, req: Request, res: Response, next: NextFunction) => {
                res.status(err.status || 500);
                res.render('error', {
                    message: err.message,
                    error: err
                });
            });
        }
        */
        // production error handler no stacktraces leaked to user
        /* this.app.use((err: any, req: Request, res: Response) => {
            res.status(err.status || 500);
            res.render('error', {
                message: err.message,
                error: {}
            })
        }) */
    };
    return Server;
}());
// this.app.listen(PORT, () => console.log('Server Running on %s:%s'/* , HOST */, PORT));
exports.default = new Server();
