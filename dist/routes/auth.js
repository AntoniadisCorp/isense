"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
// Configuring Passport
var passport_1 = __importStar(require("passport"));
// import session from 'express-session'
var global_1 = require("../global");
var mongo = require('mongojs'), db = mongo('mongodb://antoniadis:2a4b6c!8@ds161069.mlab.com:61069/car_brand', ['users']);
var authfun = function (req, res, next) {
    console.log('tasks req auth ', req && req.user ? req.user : 'req.user undefined');
    // Cookies that have not been signed
    // let isAuthenticated = () => req.session.passport && req.session.passport.user? true : false
    // console.log('auth Cookies: ', req.cookies)
    // console.log('auth session passport ', req.session).
    console.log('auth session passport ' + ('' + req.isAuthenticated()), req.session);
    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();
    // if they aren't redirect them to the home page
    res.json({ message: 'You have to sign in ..' });
}, LocalStrategy = require('passport-local').Strategy;
exports.authfun = authfun;
var NodePassStrategy = /** @class */ (function (_super) {
    __extends(NodePassStrategy, _super);
    function NodePassStrategy() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = 'test';
        return _this;
    }
    NodePassStrategy.prototype.authenticate = function (req) {
        var routinObj = new global_1.GBRoutines();
        var user = {
            _id: 0,
            email: 'prokopis123@gmail.com',
            username: 'antoniadis',
            password: routinObj.createHash('stedsad213!@#adasjnd'),
        };
        if (Math.random() > 0.5) {
            this.fail();
        }
        else {
            this.success(user);
        }
    };
    return NodePassStrategy;
}(passport_1.Strategy));
var passportInstance = new passport_1.Passport();
passportInstance.use(new NodePassStrategy());
var authenticator = new passport_1.Authenticator();
authenticator.use(new NodePassStrategy());
var newFramework = {
    initialize: function () {
        return function () { };
    },
    authenticate: function (passport, name, options) {
        return function () { return "authenticate(): " + name + " " + options; };
    },
    authorize: function (passport, name, options) {
        return function () { return "authorize(): " + name + " " + options; };
    }
};
var Auth = /** @class */ (function () {
    function Auth() {
        this.router = express_1.Router();
        this.routinObj = new global_1.GBRoutines();
        this.newUser = new global_1.User();
    }
    // Node JS Routes
    /**
     * https Router Gets
     */
    Auth.prototype.httpRoutesGets = function () {
        this.router.get('/logout', function (req, res) {
            req.logout();
            console.log('User disconnected');
            // res.json('disconnected');
            res.redirect('/');
        });
        this.router.get('/loggedIn', this.loginStatus); // get Loggin status
    };
    /**
     * https Router Posts
     */
    Auth.prototype.httpRoutesPosts = function () {
        this.router.post('/login', passport_1.default.authorize('login', { failureRedirect: '/login', failureFlash: true }), function (req, res) {
            res.redirect('/');
        });
        this.router.post('/login', this.login);
        this.router.post('/auth/token', passport_1.default.authenticate(['basic', 'oauth2-client-password'], { session: false }));
        this.router.post('/signup', this.createUser); // try to Create new User
    };
    /**
     * https Router Delete
     */
    Auth.prototype.httpRoutesDelete = function () { };
    /**
     * https Router Put
     */
    Auth.prototype.httpRoutesPut = function () { };
    /**
    * Router Functions
    */
    Auth.prototype.login = function (req, res, next) {
        passport_1.default.authenticate('login', function (err, user, info) {
            if (err) {
                return next(err);
            }
            // if (err) return res.json({ message: err });
            if (!user) {
                if (req.session) {
                    req.session['error'] = info.message;
                }
                return res.redirect('/login');
                // res.json({ message: info });
            }
            req.logIn(user, function (err) {
                if (err) {
                    return next(err);
                } // res.json(err)
                return res.redirect('/users/' + user.username);
                // console.log(`req.logIn: ${req.user._id} and auth = ` + req.isAuthenticated() + '!! ')
                // console.log('User connected')
                // return res.json(user)
            });
        })(req, res, next);
    };
    Auth.prototype.loginStatus = function (req, res, next) {
        var aut = { status: req.isAuthenticated()
            // console.log(`Auth ${aut.status}`)
        };
        res.json(aut);
    };
    Auth.prototype.createUser = function (req, res) {
        passport_1.default.authenticate('signup', function (err, user, info) {
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
            }
            else
                console.log('db user saving: ' + JSON.stringify(user));
            console.log('User Registration successfully');
            return res.json(user);
        })(req, res);
    };
    Auth.prototype.InitPassport = function () {
        var _this = this;
        passport_1.default.use(new NodePassStrategy());
        passport_1.default.framework(newFramework);
        passport_1.default.serializeUser(function (user, done) {
            console.log("serializeUser: " + user);
            done(null, user._id);
        });
        passport_1.default.serializeUser(function (user, done) {
            if (user._id && user._id > 0) {
                console.log("deserializeUser: " + user._id);
                done(null, user._id);
            }
            else {
                done(new Error('user ID is invalid'));
            }
        });
        passport_1.default.deserializeUser(function (_id, done) {
            done(null, { _id: _id });
        });
        passport_1.default.deserializeUser(function (_id, done) {
            var fetchUser = function (_id) { return Promise.reject(new Error("user not found: " + _id)); };
            fetchUser(_id)
                .then(function (user) { return done(null, user); })
                .catch(done);
        });
        passport_1.default.use(new NodePassStrategy())
            .unuse('test')
            .use(new NodePassStrategy())
            .framework(newFramework);
        passport_1.default.use('login', new LocalStrategy(function (username, password, done) {
            _this.findOrUserLoggin(username, password, done);
            // Delay the execution of findOrUserLoggin and execute 
            // the method in the next tick of the event loop
            // process.nextTick();
        }));
        passport_1.default.use('signup', new LocalStrategy({ passReqToCallback: true }, function (req, username, password, done) {
            // find for firstname and lastname and mobile
            var user = req.body.user;
            // Delay the execution of findOrCreateUser and execute 
            // the method in the next tick of the event loop
            _this.findOrCreateUser(user, username, password, done);
            // process.nextTick();
        }));
        /* this.router.use(passport.initialize())
        this.router.use(passport.session()) */
        this.router.use(function (req, res, next) {
            if (req.user) {
                if (req.user.username) {
                    req.user.username = "hello user";
                }
                if (req.user.id) {
                    req.user.id = "123";
                }
            }
            next();
        });
    };
    Auth.prototype.findOrCreateUser = function (user, username, password, done) {
        var _this = this;
        console.log('user: ' + JSON.stringify(user));
        // find a user in Mongo with provided username
        db.users.findOne({ $or: [{ username: username }, { username: user.email }, { email: user.email }, { mobile: user.mobile }] }, function (err, userexist) {
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
            }
            else {
                user.username = username;
                user.password = _this.routinObj.createHash(password);
                // save the user
                db.users.save(user, function (err, users) {
                    if (err) {
                        console.log('Error in Saving user: ', err);
                        return done(null, false, { 'message': 'Error in Saving user, ' + err });
                    }
                    // if there is no user with that email
                    // set the user's local credentials
                    return done(null, _this.newUser.set(users));
                });
            }
        });
    };
    Auth.prototype.findOrUserLoggin = function (username, password, done) {
        var _this = this;
        // Auth Check Logic
        // check in mongo if a user with username exists or not
        console.log('username ' + username + ' password ' + password);
        db.users.findOne({ $or: [{ username: username }, { email: username }, { mobile: username }] }, function (err, user) {
            // In case of any error, return using the done method
            if (err)
                return done(err);
            // Username does not exist, log error & redirect back
            if (!user) {
                console.log('User Not Found with username ' + username);
                return done(null, false, 'Your info was incorrect. Try again.');
            }
            // User exists but wrong password, log the error 
            if (!_this.routinObj.isValidPassword(user, password)) {
                console.log('User Not Found with password ' + password);
                console.log('Invalid Password');
                return done(null, false, 'Your info was incorrect. Try again.');
            }
            // User and password both match, return user from 
            // done method which will be treated like success
            console.log('login func user: ' + user._id + ' ');
            return done(null, _this.newUser.set(user));
        });
    };
    ;
    Auth.prototype.authSetting = function () {
        var authOption = {
            successRedirect: '/',
            failureRedirect: '/login',
        };
        var successCallback = function (req, res) {
            res.redirect('/');
        };
        this.router.get('/auth/facebook', passport_1.default.authenticate('facebook'));
        this.router.get('/auth/facebook/callback', passport_1.default.authenticate('facebook', authOption), successCallback);
        this.router.get('/auth/twitter', passport_1.default.authenticate('twitter'));
        this.router.get('/auth/twitter/callback', passport_1.default.authenticate('twitter', authOption));
        this.router.get('/auth/google', passport_1.default.authenticate('google', {
            scope: ['https://www.googleapis.com/auth/userinfo.profile']
        }));
        this.router.get('/auth/google/callback', passport_1.default.authenticate('google', authOption), successCallback);
    };
    Auth.prototype.ensureAuthenticated = function (req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        if (req.isUnauthenticated()) {
            res.redirect('/login');
        }
    };
    return Auth;
}());
exports.Auth = Auth;
