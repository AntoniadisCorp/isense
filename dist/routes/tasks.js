"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var global_1 = require("../global");
var node_machine_id_1 = require("node-machine-id");
// import { mainRouter } from './'
var auth_1 = require("./auth");
var device = require('express-device'), mongo = require('mongojs')
// Clever-Cloud Mongo DB
// , db = mongo('mongodb://ucrabeksjkigvz9:lijaIRixg4xgEZrBMPKj@brghyzdzarocacc-mongodb.services.clever-cloud.com:27017/brghyzdzarocacc',
//  [], { ssl: true })
// mongodb://utce60gjherh2jq:Q1NGZfi10Uxl78hqMCG4@bc58plexjcuf9xx-mongodb.services.clever-cloud.com:27017/bc58plexjcuf9xx
// mLab Mongo DB
, db = mongo('mongodb://antoniadis:2a4b6c!8@ds161069.mlab.com:61069/car_brand', ['tasks']);
// db = mongo('mongodb://antoniadis:2a4b6c!8@ds161069.mlab.com:61069/car_brand', ['users']) // mLab.com
// prokopis3
// Atlas Cloud Pure Mongo DB
//mongodb+srv://pant:<pant>@safecarcluster-sezgl.azure.mongodb.net/test?retryWrites=true&w=majority
// As with any middleware it is quintessential to call next()
// if the user is authenticated
db.on('error', function (err) {
    console.log('database error', err);
});
db.on('connect', function () {
    console.log('database connected');
});
var Tasks = /** @class */ (function () {
    function Tasks() {
        this.tk103 = { oldpass: '' };
        this.router = express_1.default.Router();
        this.router.use(device.capture());
        this.httpRoutesGets();
        this.httpRoutesPosts();
    }
    // Node JS Routes
    /**
     * https Router Gets
     */
    Tasks.prototype.httpRoutesGets = function () {
        this.router.get('/', function (req, res) {
            var d = { tasks: 'Task 1!' };
            console.log(d.tasks);
            res.send(d);
        });
        this.router.get('/get', this.tasks); // Get All Tasks
        this.router.get('/:id', this.singletask); // Get Single task
        this.router.get('/init/:id', auth_1.authfun, this.initializeUnit); // Send Begin SMS to the device
    };
    /**
     * https Router Posts
     */
    Tasks.prototype.httpRoutesPosts = function () {
        this.router.post('/emails', this.sendEmail); // send email
        this.router.post('/subscribers', this.sub); // subscribe
        this.router.post('/save', auth_1.authfun, this.savetask); // Save task
    };
    /**
     * https Router Delete
     */
    Tasks.prototype.httpRoutesDelete = function () {
        this.router.delete('/:id', auth_1.authfun, this.deletetask); // Delete task
    };
    /**
     * https Router Put
     */
    Tasks.prototype.httpRoutesPut = function () {
        this.router.put('/:id', auth_1.authfun, this.updatetask); // Update task
        this.router.put('/resetpass/:id', auth_1.authfun, this.resetpassword); // update password of the device
    };
    /**
     * Router Functions
     */
    // if the user is authenticated redirect to home
    // ---------- https Functions ToDo ----------
    Tasks.prototype.tasks = function (req, res, next) {
        console.log("dsad");
        db.tasks.find(function (err, tasks) {
            console.log(tasks);
            if (err)
                res.send(err);
            res.send(tasks);
        });
    };
    Tasks.prototype.singletask = function (req, res, next) {
        db.tasks.findOne({ _id: mongo.ObjectId(req.params.id) }, function (err, task) {
            if (err)
                res.send(err);
            res.json(task);
        });
    };
    Tasks.prototype.savetask = function (req, res, next) {
        var task = req.body;
        if (!task.title || !(task.isDone + '')) {
            res.status(400);
            res.json({
                "error": "Bad data"
            });
        }
        else {
            db.tasks.save(task, function (err, tasks) {
                if (err)
                    res.send(err);
                res.json(tasks);
            });
        }
    };
    Tasks.prototype.deletetask = function (req, res, next) {
        db.tasks.remove({ _id: mongo.ObjectId(req.params.id) }, function (err, tasks) {
            if (err)
                res.send(err);
            res.json(tasks);
        });
    };
    Tasks.prototype.updatetask = function (req, res, next) {
        var task = req.body, updTask = { isDone: true, title: '' };
        if (task.isDone)
            updTask.isDone = task.isDone;
        if (task.title)
            updTask.title = task.title;
        if (!updTask) {
            res.status(400);
            res.json({ "error": "Bad data" });
        }
        else {
            db.tasks.update({ _id: mongo.ObjectId(req.params.id) }, updTask, {}, function (err, tasks) {
                if (err)
                    res.send(err);
                res.json(tasks);
            });
        }
    };
    Tasks.prototype.initializeUnit = function (req, res) {
        var defaultpass = '123456', tk103 = { oldpass: defaultpass }, commandString = 'begin' + defaultpass; // default password
        // send command to tk03 and callback
        // if password changed
        db.tk103.save({ _id: mongo.ObjectId(req.params.id) }, tk103, {}, function (err, tkDevice) {
            if (err)
                res.send(err);
            res.json('begin ok! device is ready to used..');
        });
    };
    Tasks.prototype.authorization = function (req, res) {
        // if password fetched and send command to device tk03
        var authorizednumber = req.body, pass = this.tk103.oldpass, commandString = 'admin' + pass + ' ' + authorizednumber; // change password with +cod
        // send command to tk03 and callback
    };
    // function singleLocation(params) {
    // }
    Tasks.prototype.autotrack = function (req, res, next) {
        // if password fetched and send command to device tk03
        var type = req.body // type: cancelation or limit-unlimited
        , pass = this.tk103.oldpass, commandString = null; // change password with +cod
        // send command to tk03 and callback
        // if password fetched and send command to device tk03
        if (type == 'cancel')
            commandString = 'notn' + pass; // change password with +cod
        else if (type == 'unlimited')
            commandString = 't' + 'm' + 's_double_precesion' + 's' + '***n' + pass;
        else
            commandString = 't' + 'm' + 's_double_precesion' + 's' + 'times_third_precesion' + 'n' + pass;
    };
    Tasks.prototype.voiceMonitor = function (req, res) {
        // if password fetched and send command to device tk03
        var mode = req.body // mode = tracker mode or monitor
        , pass = this.tk103.oldpass, commandString = mode + pass;
        // send command to tk03 and callback res json
    };
    Tasks.prototype.resetpassword = function (req, res) {
        // find old password
        db.tk103.findOne({ _id: mongo.ObjectId(req.params.id) }, function (err, tkDevice) {
            if (err)
                res.send(err);
            // if fetched password send command to device tk03
            var newpass = req.body, oldpass = tkDevice.oldpass, commandString = 'password' + oldpass + ' ' + newpass; // change password
            // send command to tk03 and callback
            // if success update db.tk03 password
            tkDevice.oldpass = newpass;
            db.tk103.update({ _id: mongo.ObjectId(req.params.id) }, tkDevice.oldpass, {}, function (err, tkDevice) {
                if (err)
                    res.send(err);
                res.json('begin ok! device is ready to used..');
            });
        });
    };
    Tasks.prototype.sendEmail = function (req, res, next) {
        var emailContainer = req.body, emObj = new global_1.Emailer();
        console.log('emailer contact dialog: ', emailContainer);
        /* Conctact Emailer Promise Call back */
        emObj.contactPromise(emailContainer, function (fulfilled) {
            var respond = fulfilled;
            console.log('\n---> Task Node js contact service: ', respond);
            res.json(respond);
        });
    };
    /**
     *
     * @param {*} req
     * @param {*} res
     * @param {*} next
     * @returns {String} res Json
     */
    Tasks.prototype.sub = function (req, res, next) {
        var SubCollection = db.collection('subscribers'), Subscriber = req.body, date = new Date(), gbRout = new global_1.GBRoutines(), newdate = date.getUTCFullYear() + '-' + (date.getUTCMonth() + 1) + '-' + date.getUTCDate() + ' '
            + date.getUTCHours() + ':' + date.getUTCMinutes() + ':' + date.getUTCSeconds(), userSession = gbRout.getUserSession(res, node_machine_id_1.machineIdSync(true));
        // console.log('Subscribe: ', Subscriber)
        // find a document using a native ObjectId
        SubCollection.findOne({
            email: Subscriber.email
        }, function (err, doc) {
            if (err)
                res.json({ error: 'Response Error Subscribe Email', errorCode: 0x3 });
            if (!doc)
                SubCollection.save({ email: Subscriber.email, DateCreated: date, valid: true, used: false, userSession: userSession });
            res.json({ success: 'Email subscribed', successCode: 0x3 });
        });
    };
    return Tasks;
}());
exports.Tasks = Tasks;
