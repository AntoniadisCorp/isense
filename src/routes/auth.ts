import { Request, Response, NextFunction, Router } from 'express'
import express from 'express'
// Configuring Passport
import passport from 'passport'
import passpjwt from 'passport-jwt';
import { Timestamp } from 'bson'

import jwt from 'jsonwebtoken'
// const login = require('connect-ensure-login')

// import session from 'express-session'
import { utype, GBRoutines, User, getTokenFromHeader, isAuth, randtoken, debug } from '../global'
import { Collection, ObjectId, ObjectID } from 'mongodb';
import { DB, MemCache } from '../db';
import { Auth2 } from './auth2';
import { Token, SECRET, Client } from '../db/models';

const BearerStrategy = require('passport-http-bearer'),
    // mongo = require('mongojs'),

    // db = mongo('mongodb://antoniadis:2a4b6c!8@ds161069.mlab.com:61069/car_brand', ['users']),

    JwtStrategy = passpjwt.Strategy,
    ExtractJwt = passpjwt.ExtractJwt,

    refreshTokens: Array<string> = [],

    passportOpts = {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: SECRET, // Has to be the same that we used to sign the JWT
        userProperty: 'token', // this is where the next middleware can find the encoded data generated in services/auth:generateToken -> 'req.token'
        getToken: getTokenFromHeader, // A function to get the auth token from the request
    },

    LocalStrategy = require('passport-local').Strategy,

    gbr = new GBRoutines()
// let UserCache: any[] = []

class Auth {

    public router: Router
    // private passport: any
    // private newUser: User


    constructor(passport: any) {

        this.router = express.Router()

        // Auth2.getInstance().StartServerAuth2orize()

        // this.newUser = new User()

        this.InitPassport()
        this.httpRoutesGets()
        this.httpRoutesPosts()
        this.httpRoutesPut()
        this.httpRoutesDelete()
    }

    // Node JS Routes

    /**
     * https Router Gets
     */

    httpRoutesGets(): void {

        // this.router.get('/v2/authorize', Auth2.instance.authorization())
    }

    /**
     * https Router Posts
     */

    httpRoutesPosts(): void {

        /* this.router.post('/login',
             passport.authorize('login', { failureRedirect: '/login', failureFlash: true }),
             (req:Request, res:Response) => {
                 res.redirect('/')
             }) */

        // Log in/out User
        this.router.post('/login', this.login)
        this.router.post('/logout', this.logout)

        // Refresh Token JWT WEB TOKENS
        this.router.post('/refresh', this.RefreshTokenfun)


        // Authorization v2 server
        // this.router.post('/v2/authorize', Auth2.instance.decision())
        // this.router.post('/v2/token', isAuth, Auth2.instance.token())

        this.router.post('/signin', this.signin)
        this.router.post('/signout', this.signout)
        this.router.post('/signup', this.signup) // try to Create new User
        // this.router.post('/auth/token', passport.authenticate(['basic', 'oauth2-client-password'], { session: false }))
    }

    /**
     * https Router Put
     */

    httpRoutesPut(): void { }

    /**
     * https Router Delete
     */

    httpRoutesDelete(): void { }

    /**
    * Router Functions
    */

    private InitPassport(): void {


        passport.serializeUser((user: any, done: any) => {
            console.log(`serializeUser: ${JSON.stringify(user._id)}`);
            done(null, user._id)
        })

        passport.deserializeUser((_id: any, done: any) => {
            console.log(`deserializeUser: ${JSON.stringify(_id)}`);
            done(null, _id)
        })

        passport.use('login', new LocalStrategy(/* {

                usernameField : 'username',
                passwordField : 'password'
              }, */
            this.findOrUserLoggin
        ));

        passport.use(new BearerStrategy(
            SECRET,
            (token: Token, done: any) => {
                /* Token.findById(token._id, (err: any, user: any) {
                  
                  if (err) { return done(err); }
                  if (!user) { return done(null, false); }
                  return done(null, user, token);
                }); */
            }
        ));

        //This verifies that the token sent by the user is valid
        passport.use(new JwtStrategy(passportOpts, async (jwtPayload, done) => {

            try {
                // console.log('payload received', jwtPayload);
                const expirationDate = new Date(jwtPayload.exp * 1000);
                if (expirationDate < new Date()) {
                    return done(null, false);
                }
                // usually this would be a database call:
                //   var user = users[_.findIndex(users, {id: jwt_payload.id})];
                //Pass the user details to the next middleware
                return done(null, jwtPayload);

                /* else {
                    next(null, false);
                  } */
            } catch (error) {
                return done(error);
            }
        }))

        passport.use('signup', new LocalStrategy({

            passReqToCallback: true,
            usernameField: 'username',
            passwordField: 'password'
        },
            this.findOrSignup
        ));


    }

    /**
     *                         Signing the JWT
     * When the user logs in, the user information is passed to our custom 
     * callback which in turn creates a secure token with the information. 
     * 
     * This token is then required to be passed along as a query parameter 
     * when accessing secure routes(which we'll create later)
     *  
     * Note : We set { session : false } because we don't want to 
     * store the user details in a session. We expect 
     * the user to send the token on each request to the secure routes. 
     * This is especially useful for API's, it can be used to track users, block , etc... 
     * but if you plan on using sessions together with JWT's to secure a web application, 
     * that may not be a really good idea performance wise, more details about
     * this https://scotch.io/bar-talk/why-jwts-suck-as-session-tokens#why-do-jwts-suck.
     **/
    async login(req: Request, res: Response, next: NextFunction) {


        passport.authenticate('login', { session: false },
            (err: any, user: any, info: { message: string }) => {
                try {

                    if (err || !user) {
                        console.error(err)
                        return next(info.message);
                    }

                    // console.log(user)

                    req.logIn(user, { session: false }, async (err) => {
                        if (err) { return next(err) }
                        const { username, password } = req.body,
                            userSettings = {
                                _id: user._id,
                                username,
                                // password,
                                _session: user._session,
                                role: user.role
                            }
                        //We don't want to store the sensitive information such as the
                        //user password in the token so we pick only the email and id
                        // const {username, password} = req.body; // or email

                        // '_id': user._id,
                        const newUser = {
                            '_id': userSettings._id,
                            'username': userSettings.username,
                            'role': userSettings.role,
                            '_session': user._session
                        }



                        // store user key to redis
                        const Redisclient = new MemCache().connect(15000).cb

                        const huserExist = Redisclient.HEXISTS(`user`, `${user._id}`)

                        if (!huserExist) console.log('Redis user hash does not exist')
                        if (!!huserExist) console.log('store user key to redis already exist', huserExist)
                        else {
                            // Get user Library index
                            if (user._session && user._session.libraryId) {

                                let response: any = await getCollectionById({ id: user._session.libraryId.toString(), col: 'library' })

                                console.warn(response)
                                newUser._session.library = response.result
                                delete newUser._session['libraryId']; // Removes newUser._session.libraryId from the dictionary.
                            }

                            Redisclient.hmset(`user`, `${user._id}`, JSON.stringify(newUser), (err, redisUser) => {
                                if (err) { ; console.error(err); }
                                console.log('store user key to redis', redisUser)
                            })
                        }

                        const token = jwt.sign({ _id: newUser._id, username: newUser.username }, SECRET, { expiresIn: 600 })
                        const refreshToken: string = randtoken.uid(256)


                        // set RefreshToken
                        const refTokenKey: string = refreshToken.substring(0, 31)
                        console.log(`refreshToken: ${refTokenKey}`)
                        Redisclient.set(refTokenKey, JSON.stringify({ _id: newUser._id, username: newUser.username }), (err: any, redis: any) => {
                            if (err) console.log(err)
                            else console.log('redis: ', redis)
                        })

                        // Redis Connection Closed
                        Redisclient.quit();

                        return res.json({ userId: newUser._id, jwt: token, refreshToken: refreshToken });
                    })
                } catch (error) {
                    return next(error);
                }
            })(req, res, next)
    }

    async logout(req: Request, res: Response, next: NextFunction) {

        const refreshToken: string = req.body.refreshToken;
        console.info(`logout now, refreshToken: ${refreshToken}`)

        if (refreshToken) {
            // store user key to redis
            const refTokenKey: string = refreshToken.substring(0, 31)
            const Redisclient = new MemCache().connect(15000).cb

            // set RefreshToken
            Redisclient.del(refTokenKey, (num: any) => {
                if (num > 0) { console.log(`refreshToken '${refTokenKey}' removed from Redis`) }
            })
            // Redis Connection Closed
            Redisclient.quit();
        }

        // if (req.session!.destroy) {
        req.session!.destroy(function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log('Redis Session Destroyed');
            }
        });
        // }
        req.logOut();
        res.sendStatus(204);
    }

    async RefreshTokenfun(req: Request, res: Response, next: NextFunction) {

        const refreshToken: string = req.body.refreshToken;

        // store user key to redis
        const refTokenKey: string = refreshToken.substring(0, 31)
        const Redisclient = new MemCache().connect(15000).cb

        // set RefreshToken
        Redisclient.get(refTokenKey, (err: any, key: string) => {
            if (err) { console.log(err); Redisclient.quit(); res.sendStatus(401) }
            else {

                const token = jwt.sign(JSON.parse(key), SECRET, { expiresIn: 600 })
                Redisclient.quit()

                res.json({ jwt: token })
            }
        })
    }

    /**
     * 
     * When the user sends a post request to this route, 
     * passport authenticates the user based on the middleware created previously
     * 
     **/
    async signup(req: Request, res: Response, next: NextFunction) {

        passport.authenticate('signup', { session: false },
            async (err: any, user: { username: string }, info: { message: string }) => {

                if (err || !user) {
                    console.info(err)
                    return next(info)
                } else console.log('db user saving: ' + JSON.stringify(user));
                console.log('Signup successful!');

                return res.json({
                    message: 'Signup successful!',
                    user: req.user
                });

            })(req, res);
    }

    async signin(req: Request, res: Response, next: NextFunction) {

        passport.authenticate('login', { session: false },
            async (err: any, user: any, info: { message: string }) => {
                try {

                    if (err || !user) {
                        console.error(err)
                        return next(info.message);
                    }
                    /** Note : We set { session : false } because we don't want to 
                     * the user to send the token on each request to the secure routes. 
                     * store the user details in a session. We expect 
                     * This is especially useful for API's, it can be used to track users, block , etc... 
                     * but if you plan on using sessions together with JWT's to secure a web application, 
                     * that may not be a really good idea performance wise, more details about 
                     * this https://scotch.io/bar-talk/why-jwts-suck-as-session-tokens#why-do-jwts-suck.
                     **/
                    req.logIn(user, { session: false }, async (err) => {
                        if (err) { return next(err) }

                        const client: Client = {
                            _id: new ObjectID('5099803df3f4948bd2f98391'), // generate client app id
                            name: gbr.generateUUID('timestamp'), // newclient
                            secret: '5099803df3f4948bd2f98392', // client appsecret
                            userId: user._id,
                            ts: new Timestamp(1412180887, 1)
                        }
                        req.session!.user = {
                            _id: user._id,
                        }

                        // store key to redis
                        /* const Redisclient = new MemCache().connect(15000).cb
                        Redisclient.hmset(`client`, `${client._id}`, JSON.stringify(client), (err, client) => {
                            if (err) { Redisclient.quit(); console.error(err); }
                            Redisclient.quit()
                        }) */
                        // const dbCollection: Collection = DB.getCollection('client')
                        // if not exist create one and send back
                        return next()
                        /* dbCollection
                            .save(client)
                            .then((client: any) => {

                                if (!client) return next(false);

                                return next()
                            })
                            .catch((err: any) => { if (err) { return next(err); } }) */
                    })
                } catch (error) {
                    return next(error);
                }
            })(req, res, next)
    }

    async signout(req: Request, res: Response, next: NextFunction) {
        req.logOut();
        res.sendStatus(204).redirect('/');
    }

    async findOrSignup(req: Request, username: any, password: any, done: any) {

        try {
            // find for firstname and lastname and mobile
            // const user = req.body.user

            // Check DB Connection
            if (!DB.isConnected()) { // trying to reconnect
                await DB.connect();
            } else {

                //Save the information provided by the user to the the database
                console.log('user: ' + JSON.stringify(username));
                const dbCollection: Collection = DB.getCollection('user');

                //Find the user associated with the email provided by the user
                const userExist = await dbCollection.findOne({
                    $or: [{ username: username },
                    { mobile: username }]
                });

                // find a user in Mongo with provided username
                // In case of any error return

                if (!userExist) {
                    console.log('User not exist in DataBase.');
                    // return done(null, false, { message: "User does not Exist" });
                }

                // already exists
                if (!!userExist) {
                    return done(null, false, { message: 'User Already Exists' });
                } else {
                    console.info(`trying to register...`)
                    let user = {
                        username,
                        password: gbr.createHash(password)
                    }

                    // save the user
                    dbCollection.save(user, (err: any, user: any) => {
                        if (err) {
                            console.error('Error in Saving user: ', err);
                            return done(null, false, { message: 'Error in Saving user, ' + err });
                        }
                        // if there is no user with that email
                        // set the user's local credentials
                        // this.newUser.set(users)
                        return done(null, user, { message: 'User Succesfully created' });
                    })
                }
            }
        } catch (error) {
            done(error);
        }

        // Delay the execution of findOrSignup and execute 
        // the method in the next tick of the event loop

        // process.nextTick();

    }

    async findOrUserLoggin(username: string, password: string, done: any) {

        // Auth Check Logic
        // check in mongo if a user with username exists or not
        try {
            if (debug.explain) console.log('username ' + username + ' password ' + password);

            // Check DB Connection
            if (!DB.isConnected()) { // trying to reconnect
                await DB.connect();
            } else {

                const dbCollection: Collection = DB.getCollection('user');

                //Find the user associated with the email provided by the user
                const user = await dbCollection.findOne({
                    $or: [{ username: username },
                    { email: username }, { mobile: username }]
                });

                // Username does not exist, log error & redirect back
                if (!user) {
                    if (debug.explain) console.log('User Not Found by username ' + username);
                    //If the user isn't found in the database, return a message
                    return done(null, false, { message: 'Your credentials was incorrect. Try again.' });
                }

                // Validate password and make sure it matches with the corresponding hash stored in the database
                // If the passwords match, it returns a value of true.
                // User exists but wrong password, log the error 

                if (!gbr.isValidPassword(user, password)) {
                    if (debug.explain) console.log('User Invalid password:  ' + password + '!!!');
                    return done(null, false, { message: 'Your credentials was incorrect. Try again.' });
                }

                // User and password both match, return user from 
                // done method which will be treated like success
                // Send the user information to the next middleware
                // this.newUser.set(user)
                return done(null, user, { status: 'success', message: 'Logged in Successful' });
            }
        } catch (error) {
            if (debug.explain) console.error(`Unable to connect to Mongo!`, error);
            return done(error);
        }
        // Delay the execution of findOrUserLoggin and execute 
        // the method in the next tick of the event loop
        // process.nextTick();
    }

    /* authSetting(): void {

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
    } */

}

export function getCollectionById(query: any): Promise<any> {

    return new Promise(async (resolve, reject) => {
        try {
            // find for firstname and lastname and mobile
            const queryParams = query

            // Check DB Connection
            if (!DB.isConnected()) { // trying to reconnect
                await DB.connect();
            } else {

                console.log('Test ' + queryParams.id, queryParams)

                const dbCollection: Collection = DB.getCollection(queryParams.col);

                const exceptFields = queryParams.exceptFields ? JSON.parse(queryParams.exceptFields) : {}

                const filter: any = {
                    _id: ObjectId.isValid(queryParams.id) ? new ObjectId(queryParams.id) : Number(queryParams.id),
                    recyclebin: false
                }

                console.log('getCollectionById filter: ', filter)

                dbCollection.findOne(filter, exceptFields, (err: any, result: any) => {

                    if (err) { resolve({ code: 505, status: 'error', result: err }) }
                    resolve({ code: 200, status: 'success', result })
                })
            }
        } catch (error) {
            console.log(error)
            reject({ code: 500, status: 'error', result: error })
        }
    })

}

export { Auth }