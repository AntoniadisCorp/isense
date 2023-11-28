import { Application, Request, Response, NextFunction } from 'express'
import express from 'express'
import favicon from 'serve-favicon'
import fpath from 'path'


// GLOBAL FUNCTIONS
import { Sockets, gbr, sockAttach } from './global'

// APP ROUTES
import { mainRouter, Tasks, Auth } from './routes'

// store session state in browser cookie, keep logged in user if exist from browser or server stopped
// import cookieSession from 'cookie-session'
// import cookieParser from 'cookie-parser'
// import bodyParser from 'body-parser'
// static-favicon

// Configuring Passport
import passport from 'passport'
import session from 'express-session'
let connect_redis = require('connect-redis')

import { NodeSetSessionOptions } from './db/serverconfig/redisOptions'

import { MemCache, memjs } from './db'
import fileUpload from 'express-fileupload'
import { ServerOptions } from 'socket.io'
import { makeExpressCallback } from './express-callback'
import { notFound } from './controllers'

var device = require('express-device');
// attach session to RedisStore
const RedisStore = connect_redis(session)
//   helmet  = require('helmet')


const getDurationInMilliseconds = (start: any) => {
    const NS_PER_SEC = 1e9
    const NS_TO_MS = 1e6
    const diff = process.hrtime(start)

    return (diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS
}


// , flash    = require('connect-flash')
// , HOST = 'localhost' // prokopis.hopto.org

/* 
    Server Node Isense Application
*/
class Server {

    // Server express Application
    public app: Application

    // SERVER LISTEN PORTS
    public PORT: number | string = 8080
    public IP: string

    // Session Options - have a uniqueId
    private sessionOptions: any

    // SOCKET IO
    public socketio: (server: any, opt?: ServerOptions | undefined) => void

    //create classes routes, routines
    private routeObject: mainRouter
    private taskObject: Tasks;
    private authObject: Auth;

    // set Routines Adresses Objects and Server Port
    private env: string = process.env.NODE_ENV || 'production'

    // CONSTRUCTOR CLASS
    constructor() {


        // Create Express Application
        this.app = express()

        // TODO: figure out DNT compliance.
        this.app.use((_, res, next) => {
            res.set({ Tk: '!' })
            next()
        })

        // Routes Objects
        this.routeObject = new mainRouter()
        this.authObject = new Auth(passport)
        this.taskObject = new Tasks()

        // Create Server Socket IO
        this.socketio = sockAttach

        // Redis Session Store
        this.sessionOptions = NodeSetSessionOptions(
            'keyboard cat',
            gbr.generateUUID('UUID'),
            new RedisStore({
                host: memjs[0].host,
                port: memjs[0].port,
                client: new MemCache().connect(15000).cb,
                ttl: 260
            }))

        // this.PORT = 'production' == this.env ? process.env.OPENSHIFT_NODEJS_PORT || this.PORT : this.PORT
        this.PORT = process.env.PORT || this.PORT
        this.IP = process.env.IP || 'localhost'

        this.mainServe()
    }

    private mainServe(): void {

        // Express File uploading
        this.app.use(fileUpload());
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
        this.app.use(express.urlencoded({ limit: '3mb', extended: false }));
        this.app.use(express.json({ limit: '3mb' })) // To parse the incoming requests with JSON payloads




        // SET PASSPORT AND SESSION OPTIONS
        this.app.use(session(this.sessionOptions))
        this.app.use(passport.initialize())
        this.app.use(passport.session())

        this.app.use(device.capture())

        /* this.app.use((_, res, next) => {
            res.set({ Tk: '!' })
            next()
        }) */
        // set Headers and methods
        this.app.use((req: Request, res: Response, next: NextFunction) => {

            // if (req.session && !req.session!.views) {
            res.header('Access-Control-Allow-Origin', 'http://localhost:4200')
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-Auth-Token, Authorization')
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
            res.header('Access-Control-Allow-Credentials', 'true')

            // res.header('Content-Type', req.get('Content-Type'))
            res.header('Referer', req.get('referer'))
            res.header('User-Agent', req.get('User-Agent'))
            // }


            if ('OPTIONS' == req.method) {
                res.sendStatus(200)
            } else {

                const start = process.hrtime()

                let sQWid: any = req.session;

                sQWid!.views = sQWid!.views ? sQWid!.views + 1 : 1
                // req.session!.passport = ?

                if (req.cookies) console.error('Cookies: ', req.cookies)

                var expireTime = sQWid.cookie.maxAge / 1000;
                console.warn(`${req.ip} ${req.method} ${req.url} by sessionID ${req.sessionID} expireTime: ${expireTime}`/* , req.session */, req.session)

                /*  let requestSize = 0;
                 req.on('data', (chunk) => {
                     requestSize += Buffer.from(chunk).length;
                 }); */

                res.on('finish', () => {
                    const durationInMilliseconds = getDurationInMilliseconds(start)
                    console.log(`${req.method} ${req.originalUrl} [FINISHED] ${durationInMilliseconds.toLocaleString()} ms `)

                })

                res.on('close', () => {
                    const durationInMilliseconds = getDurationInMilliseconds(start)
                    console.log(`${req.method} ${req.originalUrl} [CLOSED] ${durationInMilliseconds.toLocaleString()} ms `)

                })


                next()
            }
            /* this.app.use(
                async function (req: Request, res: Response, next: NextFunction) {
                    const {c: req.bodySize as any } = await new Promise(function (resolve) {
                        let requestSize = 0;
                        req.on('data', (chunk) => {
                            requestSize += Buffer.from(chunk).length;
                        });
                        req.on('end', () => {
                            return resolve(requestSize)
                        });
                    });
                    next();
                }) */

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
        this.app.use(makeExpressCallback(notFound))

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

