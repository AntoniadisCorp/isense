"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var reque = require('request');
var mainRouter = /** @class */ (function () {
    function mainRouter() {
        this.router = express_1.Router();
        this.httpRoutesGets();
        this.httpRoutesPosts();
    }
    // Angular Routes
    /**
     * https Router Gets
     */
    mainRouter.prototype.httpRoutesGets = function () {
        this.router.get('/login', this.LoginPageCheck); // get login
        this.router.get('/', function (req, res) {
            var d = { message: 'Hello World!' };
            console.log(d.message);
            res.send(d);
        });
    };
    /**
     * https Router Posts
     */
    mainRouter.prototype.httpRoutesPosts = function () {
        this.router.post('/recaptcha', this.recaptcha); // post Recaptcha
    };
    /**
     * https Router Delete
     */
    mainRouter.prototype.httpRoutesDelete = function () { };
    /**
     * https Router Put
     */
    mainRouter.prototype.httpRoutesPut = function () { };
    /**
     * Router Functions
     */
    // if the user is authenticated redirect to home
    mainRouter.prototype.LoginPageCheck = function (req, res, next) {
        if (req.isAuthenticated())
            res.redirect('/');
        else
            res.json({ pol: 'rest' });
    };
    // const options = {
    //     host: 'somesite.com',
    //     port: 443,
    //     path: '/some/path',
    //     method: 'GET',
    //     headers: {
    //       'Content-Type': 'application/json'
    //     }
    //   }
    mainRouter.prototype.recaptcha = function (options, req, res) {
        // g-recaptcha-response is the key that browser will generate upon form submit.
        // if its blank or null means user has not selected the captcha, so return the error.
        if (req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
            return res.json({ "responseCode": 1, "responseDesc": "Please select captcha" });
        }
        // Put your secret key here.
        var secretKey = "--paste your secret key here--";
        // req.connection.remoteAddress will provide IP address of connected user.
        var verificationUrl = req.protocol + '://' + "www.google.com/recaptcha/api/siteverify?secret=" + secretKey +
            "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress;
        // Hitting GET request to the URL, Google will respond with success or error scenario.
        console.log('rest::getJSON recaptcha');
        reque(verificationUrl, function (error, res, body) {
            body = JSON.parse(body);
            // Success will be true or false depending upon captcha validation.
            if (body.success !== undefined && !body.success) {
                return res.json({ "responseCode": 1, "responseDesc": "Failed captcha verification" });
            }
            res.json({ "responseCode": 0, "responseDesc": "Sucess" });
        });
    };
    return mainRouter;
}());
exports.mainRouter = mainRouter;
