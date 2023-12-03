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
import connect_redis from 'connect-redis'



import { NodeSetSessionOptions } from './db/serverconfig/redisOptions'

import { MemCache, memjs } from './db'
import fileUpload from 'express-fileupload'
import { ServerOptions } from 'socket.io'
import { makeExpressCallback } from './express-callback'
import { notFound } from './controllers'
import { log } from './logger/log'
import { config } from 'dotenv'
import compression from 'compression';
import http2Express from 'http2-express-bridge'

// var device = require('express-device');
const ejs = require('ejs')
config()


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
    private env: string = process.env.NODE_ENV ?? 'production'

    // CONSTRUCTOR CLASS
    constructor() {


        // Create Express Application
        this.app = http2Express(express)

        // set up compression in express
        // this.app.use(compression())

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
        this.PORT = process.env.PORT ?? this.PORT
        this.IP = process.env.IP || 'localhost'

        this.mainServe()
    }

    private mainServe(): void {


        /**
       * HTTP Strict Transport Security (HSTS)
       * This solution is to tell the browser to never make HTTP requests again
       *  */
        /* this.app.use(helmet.hsts({
            maxAge: 7776000000,
            includeSubdomains: true
          })); */


        // View Engine
        // Set Static Folder .well-known production
        this.app.use(express.static(fpath.join(__dirname, 'public')))
        this.app.use(favicon(fpath.join(__dirname, 'public', 'favicon.ico')))

        this.app.engine('ejs', ejs.__express)
        this.app.set('views', fpath.join(__dirname, 'views'))
        this.app.set('view engine', 'ejs')



        // Body Parser MW
        this.app.use(express.urlencoded({ limit: '3mb', extended: false }));
        this.app.use(express.json({ limit: '3mb' })) // To parse the incoming requests with JSON payloads

        // Express File uploading
        this.app.use(fileUpload());
        // this.app.set('trust proxy', 1) // trust first proxy

        // SET PASSPORT AND SESSION OPTIONS
        this.app.use(session(this.sessionOptions))
        this.app.use(passport.initialize())
        this.app.use(passport.session())


        // set Headers and methods
        this.app.use(setcustomOptions)
        // this.app.use(clientRecognition)

        // USE ROUTES
        this.app.use('/', this.routeObject.router)

        // USE SECURE ROUTES
        this.app.use('/auth', this.authObject.router)
        this.app.use('/task', this.taskObject.router)
        this.app.use(makeExpressCallback(notFound))

    }

}


const shouldCompress = (req: Request, res: Response) => {
    // don't compress responses asking explicitly not
    if (req.headers['x-no-compression']) {
        return false
    }

    // use compression filter function
    return compression.filter(req, res)
}

const setcustomOptions = async (req: Request, res: Response, next: NextFunction) => {


    /* res.header('Access-Control-Allow-Origin', 'http://localhost:4200')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-Auth-Token, Authorization')
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    res.header('Access-Control-Allow-Credentials', 'true')

    res.header('Referer', req.get('referer'))
    res.header('User-Agent', req.get('User-Agent')) */

    if ('OPTIONS' == req.method) {
        res.sendStatus(200)
    } else {

        const start = process.hrtime()

        let sQWid: any = req.session;

        sQWid!.views = sQWid!.views ? sQWid!.views + 1 : 1

        if (req.cookies) log('Cookies: ', req.cookies)

        // get the size of bytes that read from request
        /*  let requestSize = 0;
         req.on('data', (chunk) => {
             requestSize += Buffer.from(chunk).length;
         }); */

        res.on('finish', () => {
            const durationInMilliseconds = getDurationInMilliseconds(start)
            log(`${req.ip} ${req.method} ${req.originalUrl} by sessionID ${req.sessionID} with cookie expireTime: ${sQWid.cookie.maxAge / 1000} [FINISHED] in ${durationInMilliseconds.toLocaleString()} ms, views ${sQWid!.views} `)

        })

        res.on('close', () => {
            const durationInMilliseconds = getDurationInMilliseconds(start)
            log(`${req.ip} ${req.method} ${req.originalUrl} by sessionID ${req.sessionID} with cookie expireTime: ${sQWid.cookie.maxAge / 1000} [CLOSED] in ${durationInMilliseconds.toLocaleString()} ms `)

        })

        return next()
    }
}

const clientRecognition = async (req: Request, res: Response, next: NextFunction) => { // app.all('*')

    // var schema = (req.headers['x-forwarded-proto'] || 'none'); // app.all('*')

    /*  if (req.hostname != 'localhost' && schema != 'https') {
 
         // res.set('x-forwarded-proto', 'https');
         // res.redirect('https://' + req.get('host') + req.url);
 
     } else {
         // Use res.sendFile, as it streams instead of reading the file into memory.
         // res.sendFile(fpath.join(__dirname + '/public/dist/ind.html'))
     } */
    // Cookies that have not been signed
    log('----> New User connected ' + `https://${req.headers.host}${req.url}`)

    log('DATE: ' + new Date() + ' ' + req.socket.remoteAddress + ' ' + req.method + ' ' + req.url + ' ');

    // Cookies that have not been signed
    log('Cookies: ', req.cookies)

    // Cookies that have been signed
    log('Signed Cookies: ', req.signedCookies)
    // log('session Cookies: ', req.session)

    return next()
}

export default new Server()



/* this.app.use( async function (req: Request, res: Response, next: NextFunction) {
    const {c: req.bodySize as any } = await new Promise(function (resolve) {
        let requestSize = 0;
        req.on('data', (chunk) => {
            requestSize += Buffer.from(chunk).length;
        });
        req.on('end', () => {
            return resolve(requestSize)
        });
    });
    return next();
}) */
// Cookie Session
/* this.app.use(cookieSession({
    keys: ["keyboard cat cat1","keyboard cat cat2"],
    // secret: 'tobo!',
    maxAge: 60 * 60 * 1000,
})) */

// cookieParser
// this.app.use(cookieParser('secretSign#143_!223'))