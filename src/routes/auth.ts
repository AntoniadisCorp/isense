import {Request,Response,NextFunction, Router} from 'express'

// Configuring Passport
import passport, {Strategy, Framework, Authenticator, Passport} from 'passport'
// import session from 'express-session'
import { utype, GBRoutines, User } from '../global'
let mongo = require('mongojs'),
    db = mongo('mongodb://antoniadis:2a4b6c!8@ds161069.mlab.com:61069/car_brand', ['users'])


let authfun =  (req: Request, res: Response, next:NextFunction) => {
    console.log('tasks req auth ', req && req.user ? req.user : 'req.user undefined');
    
    // Cookies that have not been signed
    // let isAuthenticated = () => req.session.passport && req.session.passport.user? true : false
    // console.log('auth Cookies: ', req.cookies)
    // console.log('auth session passport ', req.session).
    console.log('auth session passport ' + ('' + req.isAuthenticated()), req.session);

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated()) return next();
    // if they aren't redirect them to the home page
    res.json({ message: 'You have to sign in ..' });
}, 

LocalStrategy = require('passport-local').Strategy

class NodePassStrategy extends Strategy {
    
    name = 'test'

    authenticate(req: Request) {

        const routinObj = new GBRoutines()

        let user: utype = {
            _id: 0,
            email: 'prokopis123@gmail.com',
            username: 'antoniadis',
            password: routinObj.createHash('stedsad213!@#adasjnd'),
        }

        if (Math.random() > 0.5) {
            this.fail()
        } else {
            
            this.success(user)
        }
    }
}

const passportInstance = new Passport()
passportInstance.use(new NodePassStrategy())

const authenticator = new Authenticator()
authenticator.use(new NodePassStrategy())

declare global {
    namespace Express {
        interface User {
            username: string
        }
    }
}

const newFramework: Framework = {

    initialize() {
        return () => { }
    },
    authenticate(passport, name, options) {
        return () => `authenticate(): ${name} ${options}`
    },
    authorize(passport, name, options) {
        return () => `authorize(): ${name} ${options}`
    }
}

class Auth {
    
    public router: Router
    private routinObj: GBRoutines
    private newUser: User
    
    constructor () {

        this.router = Router()
        this.routinObj = new GBRoutines()
        this.newUser = new User()
    }

    // Node JS Routes

    /**
     * https Router Gets
     */

    httpRoutesGets(): void {

        this.router.get('/logout', (req:Request, res:Response) => {
            req.logout()
            console.log('User disconnected');
            // res.json('disconnected');
            res.redirect('/')
        })
        this.router.get('/loggedIn', this.loginStatus); // get Loggin status
    }

    /**
     * https Router Posts
     */

    httpRoutesPosts(): void {
        
       this.router.post('/login',
            passport.authorize('login', { failureRedirect: '/login', failureFlash: true }),
            (req:Request, res:Response) => {
                res.redirect('/')
            })
        this.router.post('/login', this.login)
        this.router.post('/auth/token', passport.authenticate(['basic', 'oauth2-client-password'], { session: false }))
        this.router.post('/signup', this.createUser); // try to Create new User
    }

    /**
     * https Router Delete
     */

    httpRoutesDelete(): void {}

    /**
     * https Router Put
     */

    httpRoutesPut(): void {}

     /**
     * Router Functions
     */

    login (req:Request, res:Response, next:NextFunction) {

        passport.authenticate('login', (err: any, user: { username: string }, info: { message: string }) => {
            if (err) { return next(err) }
            // if (err) return res.json({ message: err });
            if (!user) {
                if (req.session) {
                    req.session['error'] = info.message
                }
                return res.redirect('/login')
                // res.json({ message: info });
            }
            req.logIn(user, (err) => {
                if (err) { return next(err) } // res.json(err)
                return res.redirect('/users/' + user.username)
                // console.log(`req.logIn: ${req.user._id} and auth = ` + req.isAuthenticated() + '!! ')
                // console.log('User connected')
                // return res.json(user)
            })
        })(req, res, next)
    }

    loginStatus (req: Request, res:Response, next:NextFunction) {
        let aut = { status: req.isAuthenticated()
          // console.log(`Auth ${aut.status}`)
        };res.json(aut);
    }

    createUser(req: Request, res:Response) {

        passport.authenticate('signup', (err: any, user: { username: string }, info: { message: string }) => {
      
          if (err) {
            // res.status(401)
            return res.json({ message: err });
          }
          if (!user) {
            // res.json({
            //     "status": "User Exist try again"
            // })
            // res.status(400)
            return res.json(info);
          } else console.log('db user saving: ' + JSON.stringify(user));
          console.log('User Registration successfully');
          return res.json(user);

        })(req, res);
      }

     InitPassport (): void {

        
        passport.use(new NodePassStrategy())
        passport.framework(newFramework)

        passport.serializeUser((user: utype, done: (err: any, id?: number) => void) => {
            console.log(`serializeUser: ${user}` );
            done(null, user._id)
        })

        passport.serializeUser<utype, number>((user, done) => {
            if (user._id && user._id > 0) {
                console.log(`deserializeUser: ${user._id}`);
                done(null, user._id)
            } else {
                done(new Error('user ID is invalid'))
            }
        })
        
        passport.deserializeUser((_id, done) => {
            done(null, { _id })
        })
        
        passport.deserializeUser<utype, number>((_id, done) => {
            const fetchUser = (_id: number): Promise<utype> => Promise.reject(new Error(`user not found: ${_id}`))
        
            fetchUser(_id)
                .then((user) => done(null, user))
                .catch(done)
        })
        
        passport.use(new NodePassStrategy())
            .unuse('test')
            .use(new NodePassStrategy())
            .framework(newFramework)

        passport.use('login', new LocalStrategy( (username:string, password:string, done:any) => {

            this.findOrUserLoggin(username,password,done)
            // Delay the execution of findOrUserLoggin and execute 
            // the method in the next tick of the event loop
            // process.nextTick();
        }));
            
        passport.use('signup', new LocalStrategy({ passReqToCallback: true }, (req:Request, username:string, password:string, done:any) => {
            // find for firstname and lastname and mobile
            var user = req.body.user

            // Delay the execution of findOrCreateUser and execute 
            // the method in the next tick of the event loop
            this.findOrCreateUser(user, username,password, done)
            // process.nextTick();
        }));
        
        /* this.router.use(passport.initialize())
        this.router.use(passport.session()) */

        this.router.use( (req: Request, res: Response, next: (err?: any) => void) => {
            if (req.user) {
                if (req.user.username) {
                    req.user.username = "hello user"
                }
                if (req.user.id) {
                    req.user.id = "123"
                }
            }
            next()
        })
    }

    findOrCreateUser(user:utype,username:any,password:any,done: any) {
        
        console.log('user: ' + JSON.stringify(user));
        // find a user in Mongo with provided username
        db.users.findOne({ $or: [{ username: username }, { username: user.email }, { email: user.email }, { mobile: user.mobile }] }, (err:any, userexist:boolean) => {
            // In case of any error return
            if (err) {
                console.log('Error in SignUp: ', err);
                return done(err);
            }
        
            if (!user) {
                console.log('error Bad data');
                return done(null, false, { "message": "Bad data" });
            }
            // already exists
            if (userexist) {
                console.log('User already exists');
                return done(null, false, { 'message': 'User Already Exists' });
            } else {
        
                user.username = username;
                user.password = this.routinObj.createHash(password);
                // save the user
                db.users.save(user, (err:any, users:utype) => {
                    if (err) {
                        console.log('Error in Saving user: ', err);
                        return done(null, false, { 'message': 'Error in Saving user, ' + err });
                    }
                    // if there is no user with that email
                    // set the user's local credentials
            
                    return done(null, this.newUser.set(users));
                })
            }
        })
    }

     findOrUserLoggin(username:string, password:string, done:any) {
        // Auth Check Logic
        // check in mongo if a user with username exists or not
        console.log('username ' + username + ' password ' + password);
    
        db.users.findOne({ $or: [{ username: username }, { email: username }, { mobile: username }] }, (err:any, user:utype) => {
        // In case of any error, return using the done method
        if (err) return done(err);
        // Username does not exist, log error & redirect back
        if (!user) {
            console.log('User Not Found with username ' + username);
            return done(null, false, 'Your info was incorrect. Try again.');
        }
        // User exists but wrong password, log the error 
        if (!this.routinObj.isValidPassword(user, password)) {
            console.log('User Not Found with password ' + password);
            console.log('Invalid Password');
            return done(null, false, 'Your info was incorrect. Try again.');
        }
    
        // User and password both match, return user from 
        // done method which will be treated like success

        console.log('login func user: ' + user._id + ' ');
        return done(null, this.newUser.set(user));
        });
    };

     authSetting(): void {

        const authOption = {
            successRedirect: '/',
            failureRedirect: '/login',
        }
        const successCallback = (req: Request, res: Response) => {
            res.redirect('/')
        }
    
        this.router.get('/auth/facebook',
            passport.authenticate('facebook'))

        this.router.get('/auth/facebook/callback',
            passport.authenticate('facebook', authOption), successCallback)
    
        this.router.get('/auth/twitter',
            passport.authenticate('twitter'))
        
        this.router.get('/auth/twitter/callback',
            passport.authenticate('twitter', authOption))
    
        this.router.get('/auth/google',
            passport.authenticate('google', {
                scope:
                    ['https://www.googleapis.com/auth/userinfo.profile']
            }))
        
        this.router.get('/auth/google/callback',
        passport.authenticate('google', authOption), successCallback)
    }
    
    ensureAuthenticated(req: Request, res: Response, next: NextFunction) {

        if (req.isAuthenticated()) { return next() }
        if (req.isUnauthenticated()) {
            res.redirect('/login')
        }
    }

}

export { Auth, authfun }