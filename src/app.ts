import express, { Application, Request, Response, NextFunction } from 'express'
import favicon from 'serve-favicon'
import fpath from 'path'
import socketio from 'socket.io'

// GLOBAL FUNCTIONS
import { Sockets, GBRoutines } from './global'

// APP ROUTES
import { mainRouter, Tasks, Auth }  from './routes'

// store session state in browser cookie, keep logged in user if exist from browser or server stopped
import cookieSession from 'cookie-session'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
// static-favicon

// Configuring Passport
import passport from 'passport'
import session from 'express-session'
import connect_redis from 'connect-redis'

import { NodeSetSessionOptions } from './db/serverconfig/serverOptions'
import { MemCache, memjs } from './db'

// attach session to RedisStore
const RedisStore = connect_redis(session),
      helmet  = require('helmet');






// , flash    = require('connect-flash')
// , HOST = 'localhost' // prokopis.hopto.org

/* 
    Server Node Isense Application
*/
class Server {

    // Server express Application
    public app: Application
    // SOCKET IO
    public socketio: any
    // SERVER LISTEN PORTS
    public PORT: number | string = 8080
    public IP: string

    //create classes routes, routines
    private gbObject: GBRoutines = new GBRoutines()
    private routeObject: mainRouter = new mainRouter()
    private taskObject: Tasks = new Tasks()
    private authObject: Auth = new Auth(passport)

    
    // Session Options - have a uniqueId
    private sessionOptions: any

     // set Routines Adresses Objects and Server Port
    private env: string = process.env.NODE_ENV || 'production'

    // CONSTRUCTOR CLASS
    constructor () {


        // Create Express Application
        this.app = express()

        // Create Server Socket IO
        this.socketio = this.sockattach

        // Redis Session Store
        this.sessionOptions = NodeSetSessionOptions(
                'keyboard cat',
                this.gbObject.generateUUID('UUID'), 
                new RedisStore({ 
                host: memjs[0].host,
                port: memjs[0].port, 
                client: new MemCache().connect(15000).cb, 
                ttl :  260 
            }) )

        // this.PORT = 'production' == this.env ? process.env.OPENSHIFT_NODEJS_PORT || this.PORT : this.PORT
        this.PORT = process.env.PORT || this.PORT
        this.IP = process.env.IP || 'localhost'

        this.mainServe()
    }

    // USE SOCKET IO
    private sockattach (server: any) {

        let socketObject: Sockets = new Sockets()
        socketObject.attach(socketio.listen(server))
    }
  
    private mainServe (): void {
        
        // View Engine
        
        this.app.use(express.static(fpath.join(__dirname, 'public')))
        this.app.use(favicon(fpath.join(__dirname, 'public', 'favicon.ico')))

        // Set Static Folder .well-known production
        // this.app.use(express.static(fpath.join(__dirname, '../','.well-known')))

        this.app.engine('ejs', require('ejs').__express)
        this.app.set('views', fpath.join(__dirname, 'views'))
        this.app.set('view engine', 'ejs')

        /**
         * HTTP Strict Transport Security (HSTS)
         * This solution is to tell the browser to never make HTTP requests again
         *  */ 
        /* this.app.use(helmet.hsts({
            maxAge: 7776000000,
            includeSubdomains: true
          })); */

        
        // Cookie Session
        /* this.app.use(cookieSession({
            keys: ["keyboard cat cat1","keyboard cat cat2"],
            // secret: 'tobo!',
            maxAge: 60 * 60 * 1000,
        })) */

        // cookieParser
        // this.app.use(cookieParser('secretSign#143_!223'))
        // Body Parser MW
        this.app.use(bodyParser.json({limit: '2mb'}))
        this.app.use(bodyParser.urlencoded({limit: '2mb', extended: false}))

        

        // SET PASSPORT AND SESSION OPTIONS
        this.app.use(session(this.sessionOptions))
        this.app.use(passport.initialize())
        this.app.use(passport.session())



        // set Headers and methods
        this.app.use( (req: Request, res: Response, next: NextFunction) => {

            res.header('Access-Control-Allow-Origin','http://localhost:4200')
            res.header('Access-Control-Allow-Headers','Origin, X-Requested-With, Content-Type, Accept, X-Auth-Token, Authorization')
            res.header('Access-Control-Allow-Methods','OPTIONS, GET, PATCH, POST, PUT, DELETE')
            res.header('Access-Control-Allow-Credentials', 'true' );

            if ('OPTIONS' == req.method) {
                res.sendStatus(200)
            } else {

                let sQWid = req.session;

                sQWid!.views = sQWid!.views? sQWid!.views+1 : 1
                // req.session!.passport = ?

                if (req.cookies) console.error('Cookies: ' ,req.cookies)
                console.error(`${req.ip} ${req.method} ${req.url} by session`, req.session)
                next()
            }

        })

        /* this.app.use( (req:Request, res:Response, next: NextFunction) => { // app.all('*')

            var schema = (req.headers['x-forwarded-proto'] || 'none');
            
            if ( req.hostname != 'localhost' && schema != 'https' ) {
        
                // res.set('x-forwarded-proto', 'https');
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
            // console.log('session Cookies: ', req.session)
        
            
        }) */

        // USE ROUTES
        this.app.use('/', this.routeObject.router)
        // secure Route
        this.app.use('/auth', this.authObject.router)
        this.app.use('/task', this.taskObject.router)

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
    }

}


export default new Server()
