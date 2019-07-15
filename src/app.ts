import express, { Application, Request, Response, NextFunction } from 'express'
import favicon from 'serve-favicon'
import fpath from 'path'
import socketio from 'socket.io'

// GLOBAL FUNCTIONS
import { Sockets, GBRoutines } from './global'

// APP ROUTES
import { mainRouter, Tasks }  from './routes'

// store session state in browser cookie, keep logged in user if exist from browser or server stopped
import cookieSession from 'cookie-session'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'

// Configuring Passport
import passport from 'passport'
import session from 'express-session'

// , flash    = require('connect-flash')
// , HOST = 'localhost' //prokopis.hopto.org


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

    
    // Session Options - have a uniqueId
    private sessionOptions: any

     // set Routines Adresses Objects and Server Port
    private env: string = process.env.NODE_ENV || 'production'

    // CONSTRUCTOR CLASS
    constructor () {

        this.app = express()

        this.socketio = this.sockattach

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
        }

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
        this.app.use(favicon(fpath.join(__dirname + '/favicon.ico')))

        // Set Static Folder dist production
        this.app.use(express.static(fpath.join(__dirname + '/dist')))

        this.app.set('views', express.static(fpath.join(__dirname + '/views')))
        // this.app.use('/scripts', express.static(fpath.join(__dirname + '/public/node_modules')))
        // this.app.set('view engine', 'ejs')

        // app.engine('html', require('ejs').renderFile)

        // cookieParser
        this.app.use(cookieParser())
        // Body Parser MW
        this.app.use(bodyParser.json({limit: '2mb'}))
        this.app.use(bodyParser.urlencoded({limit: '2mb', extended: false}))

        // Cookie Session
        this.app.use(cookieSession({
            keys: ['Pame sta aperathou aurio?', 'Nai kai olo to kalokairi@@@'],
            secret: 'tobo!',
            maxAge: 60 * 60 * 1000,
        }))

        // set Headers and methods
        this.app.use( (req: Request, res: Response, next: NextFunction) => {
            res.header('Access-Control-Allow-Origin','*')
            res.header('Access-Control-Allow-Headers','Origin, X-Requested-With, Content-Type, Accept, X-Auth-Token')
            res.header('Access-Control-Allow-Methods','OPTIONS, GET, PATCH, POST, PUT, DELETE')
            if ('OPTIONS' == req.method) {
                res.sendStatus(200)
            } else {
                
                console.log(`${req.ip} ${req.method} ${req.url}`)
                next()
            }

        })

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
        this.app.use('/', this.routeObject.router)
        this.app.use('/task', this.taskObject.router)

        // SET PASSPORT AND SESSION OPTIONS
        this.app.use(session(this.sessionOptions))
        this.app.use(passport.initialize())
        this.app.use(passport.session())



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

// this.app.listen(PORT, () => console.log('Server Running on %s:%s'/* , HOST */, PORT));

export default new Server()
