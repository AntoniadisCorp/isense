import { Router, Request, Response, NextFunction } from 'express'
import { log } from '../logger/log';
const reque = require('request');

class mainRouter {

    //get router
    public router: Router;

    constructor() {

        this.router = Router()
        this.httpRoutesGets()
        this.httpRoutesPosts()
        this.httpRoutesPut()
        this.httpRoutesDelete()
    }


    // Angular Routes

    /**
     * https Router Gets
     */

    httpRoutesGets(): void {


        this.router.get('/ServiceLogin', this.ServiceLogin) // get ServiceLogin

        const startPage = async (req: Request, res: Response) => {
            let d = { message: 'Hello World!', sessionInfo: '' }
            if (req.session && req.session!.id) {
                d = { message: 'Hello Redis World!', sessionInfo: req.session!.id, }
            }
            console.log(d.message)
            res.render('index', d)
        }
        this.router.get('/', startPage)
    }

    /**
     * https Router Posts
     */

    httpRoutesPosts(): void {

        this.router.post('/recaptcha', this.recaptcha) // post Recaptcha
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

    // if the user is authenticated redirect to home

    // const options = {
    //     host: 'somesite.com',
    //     port: 443,
    //     path: '/some/path',
    //     method: 'GET',
    //     headers: {
    //       'Content-Type': 'application/json'
    //     }
    //   }

    async ServiceLogin(req: Request, res: Response, next: NextFunction) {
        if (req.isAuthenticated()) res.redirect('/')
        res.render('signin')
    }



    async recaptcha(options: any, req: Request, res: Response) {

        // g-recaptcha-response is the key that browser will generate upon form submit.
        // if its blank or null means user has not selected the captcha, so return the error.
        if (req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
            return res.json({ "responseCode": 1, "responseDesc": "Please select captcha" });
        }

        // Put your secret key here.
        let secretKey: string = "--paste your secret key here--";
        // req.connection.remoteAddress will provide IP address of connected user.
        let verificationUrl: string = req.protocol + '://' + "www.google.com/recaptcha/api/siteverify?secret=" + secretKey +
            "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress

        // Hitting GET request to the URL, Google will respond with success or error scenario.
        log('rest::getJSON recaptcha');

        reque(verificationUrl, (error: any, res: Response, body: any) => {

            body = JSON.parse(body);
            // Success will be true or false depending upon captcha validation.

            if (body.success !== undefined && !body.success) {
                return res.json({ "responseCode": 1, "responseDesc": "Failed captcha verification" });
            }
            res.json({ "responseCode": 0, "responseDesc": "Sucess" });
        });
    }
}


export { mainRouter }