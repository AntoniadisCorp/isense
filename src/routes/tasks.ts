import express, {Request,Response,NextFunction, Router} from 'express'
import { Emailer, GBRoutines } from '../global'
import {machineId, machineIdSync} from 'node-machine-id';
// import { mainRouter } from './'
import { authfun as auth } from './auth'

let device = require('express-device')
, mongo  = require('mongojs')
// Clever-Cloud Mongo DB
// , db = mongo('mongodb://ucrabeksjkigvz9:lijaIRixg4xgEZrBMPKj@brghyzdzarocacc-mongodb.services.clever-cloud.com:27017/brghyzdzarocacc',
//  [], { ssl: true })
// mongodb://utce60gjherh2jq:Q1NGZfi10Uxl78hqMCG4@bc58plexjcuf9xx-mongodb.services.clever-cloud.com:27017/bc58plexjcuf9xx

// mLab Mongo DB
, db = mongo('mongodb://antoniadis:2a4b6c!8@ds161069.mlab.com:61069/car_brand', ['tasks'])
// db = mongo('mongodb://antoniadis:2a4b6c!8@ds161069.mlab.com:61069/car_brand', ['users']) // mLab.com
// prokopis3
// Atlas Cloud Pure Mongo DB
//mongodb+srv://pant:<pant>@safecarcluster-sezgl.azure.mongodb.net/test?retryWrites=true&w=majority

// As with any middleware it is quintessential to call next()
// if the user is authenticated


db.on('error', (err: any) => {
    console.log('database error', err)
})
 
db.on('connect', () => {

    console.log('database connected')
})

interface tk103Device {
    
    oldpass: string
}

class Tasks {

    public router: Router
    public tk103: tk103Device
    
    constructor() {

        this.tk103 = {oldpass:''}
        this.router = express.Router()
        this.router.use(device.capture())
        this.httpRoutesGets()
        this.httpRoutesPosts()
    }

    
    // Node JS Routes

    /**
     * https Router Gets
     */

    httpRoutesGets(): void {

        this.router.get('/', (req:Request, res:Response) => {
            let d = {  tasks: 'Task 1!' }
            console.log(d.tasks)
            res.send(d)
          })
        
        this.router.get('/get', this.tasks); // Get All Tasks
        this.router.get('/:id', this.singletask); // Get Single task
        this.router.get('/init/:id', auth, this.initializeUnit); // Send Begin SMS to the device
    }

    /**
     * https Router Posts
     */

    httpRoutesPosts(): void {

        this.router.post('/emails', this.sendEmail) // send email
        this.router.post('/subscribers', this.sub) // subscribe
        this.router.post('/save', auth, this.savetask); // Save task
    }

    /**
     * https Router Delete
     */

    httpRoutesDelete(): void {

        this.router.delete('/:id', auth, this.deletetask); // Delete task
    }

    /**
     * https Router Put
     */

    httpRoutesPut(): void {

        this.router.put('/:id', auth, this.updatetask); // Update task
        this.router.put('/resetpass/:id', auth, this.resetpassword); // update password of the device
    }

    /**
     * Router Functions
     */

    // if the user is authenticated redirect to home
    // ---------- https Functions ToDo ----------
    tasks(req:Request, res:Response, next:NextFunction) {
        console.log("dsad")
        db.tasks.find( (err:any, tasks:Object) => {
            console.log(tasks);
            if (err) res.send(err);
            res.send(tasks);
        });
    }

    singletask(req:Request, res:Response, next:NextFunction) {

        db.tasks.findOne({ _id: mongo.ObjectId(req.params.id) }, (err:any, task:Object) => {
            if (err) res.send(err);
            res.json(task);
        });
    }

    savetask(req:Request, res:Response, next:NextFunction) {

        var task = req.body;
    
        if (!task.title || !(task.isDone + '')) {
            res.status(400);
            res.json({
                "error": "Bad data"
            });
        } else {
            db.tasks.save(task,  (err:any, tasks:Object) => {
                if (err) res.send(err);
                res.json(tasks);
            });
        }
    }
    
    deletetask(req:Request, res:Response, next:NextFunction) {
    
        db.tasks.remove({ _id: mongo.ObjectId(req.params.id) },  (err:any, tasks:Object) => {
            if (err) res.send(err);
            res.json(tasks);
        });
    }
    
    updatetask(req:Request, res:Response, next:NextFunction) {
    
        var task = req.body,
            updTask = {isDone:true,title:''};
    
        if (task.isDone) updTask.isDone = task.isDone;
        if (task.title) updTask.title = task.title;
        if (!updTask) {
            res.status(400);
            res.json({ "error": "Bad data" });
        } else {
            db.tasks.update({ _id: mongo.ObjectId(req.params.id) }, updTask, {}, function (err:any, tasks:Object) {
                if (err) res.send(err);
                res.json(tasks);
            });
        }
    }

    initializeUnit(req: Request, res: Response) {

        var defaultpass = '123456',
        tk103 = { oldpass: defaultpass },
        commandString = 'begin' + defaultpass // default password
    
        // send command to tk03 and callback
    
        // if password changed
        db.tk103.save({ _id: mongo.ObjectId(req.params.id) }, tk103, {}, (err:any, tkDevice:tk103Device ) => {
            if (err) res.send(err);
            res.json('begin ok! device is ready to used..');
        });
    }

    authorization(req: Request, res: Response) {

        // if password fetched and send command to device tk03
        var authorizednumber = req.body,
            pass = this.tk103.oldpass,
            commandString = 'admin' + pass + ' ' + authorizednumber; // change password with +cod
    
        // send command to tk03 and callback
    }
    
    // function singleLocation(params) {
    
    // }
    
    autotrack(req: Request, res: Response, next:NextFunction) {
    
        // if password fetched and send command to device tk03
        var type = req.body // type: cancelation or limit-unlimited
        ,
            pass = this.tk103.oldpass,
            commandString = null; // change password with +cod
    
        // send command to tk03 and callback
    
        // if password fetched and send command to device tk03
        if (type == 'cancel') commandString = 'notn' + pass; // change password with +cod
        else if (type == 'unlimited') commandString = 't' + 'm' + 's_double_precesion' + 's' + '***n' + pass;else commandString = 't' + 'm' + 's_double_precesion' + 's' + 'times_third_precesion' + 'n' + pass;
    }
    
    voiceMonitor(req: Request, res: Response) {
    
        // if password fetched and send command to device tk03
        var mode = req.body // mode = tracker mode or monitor
        ,
            pass = this.tk103.oldpass,
            commandString = mode + pass;
        // send command to tk03 and callback res json
    }
    
    resetpassword(req: Request, res: Response) {
    
        // find old password
        db.tk103.findOne({ _id: mongo.ObjectId(req.params.id) }, function (err:any, tkDevice:tk103Device) {
            if (err) res.send(err);
    
            // if fetched password send command to device tk03
            var newpass = req.body,
                oldpass = tkDevice.oldpass,
                commandString = 'password' + oldpass + ' ' + newpass; // change password
    
            // send command to tk03 and callback
    
            // if success update db.tk03 password
            tkDevice.oldpass = newpass;
    
            db.tk103.update({ _id: mongo.ObjectId(req.params.id) }, tkDevice.oldpass, {}, (err:any, tkDevice:tk103Device) => {
                if (err) res.send(err);
                res.json('begin ok! device is ready to used..');
            });
        });
    }
    

    sendEmail(req: Request, res: Response, next: NextFunction) {


        let emailContainer = req.body,
            emObj: Emailer = new Emailer()
        
        console.log('emailer contact dialog: ', emailContainer)
        
        /* Conctact Emailer Promise Call back */
        emObj.contactPromise(emailContainer, (fulfilled:any) => {

            let respond = fulfilled
            console.log('\n---> Task Node js contact service: ', respond)
            res.json(respond)
        })

    }

    /**
     * 
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     * @returns {String} res Json
     */
    sub(req:Request, res:Response, next:NextFunction) {
        
        let SubCollection = db.collection('subscribers'),
            Subscriber = req.body,
            date = new Date(),
            gbRout = new GBRoutines(),

            newdate = date.getUTCFullYear() + '-' + (date.getUTCMonth() + 1) + '-' + date.getUTCDate() + ' '
                + date.getUTCHours() + ':' + date.getUTCMinutes() + ':' + date.getUTCSeconds(),

            userSession = gbRout.getUserSession(res, machineIdSync(true));
        
        // console.log('Subscribe: ', Subscriber)
        // find a document using a native ObjectId
        SubCollection.findOne({

            email: Subscriber.email
        }, (err:any, doc:any) => {

            if (err)
                res.json({error: 'Response Error Subscribe Email', errorCode: 0x3})
            if (!doc)
                SubCollection.save({email: Subscriber.email, DateCreated: date, valid: true, used: false, userSession })
                res.json({success: 'Email subscribed', successCode: 0x3})
        })
        
    }


}

export { Tasks }