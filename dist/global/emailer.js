"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var nodemailer_1 = __importDefault(require("nodemailer"));
var email = require('emailjs');
var acc = {
    user: 'info@technicalprb.com',
    host: 'uk3.fcomet.com',
    pass: 'For(Life!=0)',
    port: 25,
    secure: true
};
var Emailer = /** @class */ (function () {
    function Emailer() {
        this.server = email.server.connect({
            user: acc.user,
            password: acc.pass,
            host: acc.host,
            port: acc.port,
            _secure: acc.secure,
        });
    }
    Emailer.prototype.emailjs = function (mailOptions) {
        var message = {
            text: mailOptions.text,
            from: mailOptions.from,
            to: mailOptions.to,
            // cc:		"else <else@your-email.com>",
            subject: mailOptions.subject,
        };
        // send the message and get a callback with an error or details of the message that was sent
        this.server.send(message, function (err, message) {
            var out = err || message;
            console.log('emailjs ', out);
            return !err ? { info: out } : { error: out };
        });
    };
    Emailer.prototype.send = function (emailContainer, callback) {
        // Generate test SMTP service account from ethereal.email
        // Only needed if you don't have a real mail account for testing
        nodemailer_1.default.createTestAccount(function (err, account) {
            // create reusable transporter object using the default SMTP transport
            var transporter = nodemailer_1.default.createTransport({
                host: acc.host,
                port: 465,
                // pool: true,
                secure: acc.secure,
                requireTLS: true,
                auth: {
                    user: acc.user,
                    pass: acc.pass // generated ethereal password
                },
                tls: {
                    // do not fail on invalid certs
                    rejectUnauthorized: false
                }
            });
            // setup email data with unicode symbols
            var mailOptions = {
                from: "\"" + emailContainer.name + ". \uD83D\uDC7B\" <" + emailContainer.email + ">",
                to: acc.user,
                subject: emailContainer.subject + " \u2714 Page Form",
                text: "" + emailContainer.message,
                html: "<b>" + emailContainer.message + "</b>" // html body
            };
            // send mail with defined transport object
            transporter.sendMail(mailOptions, function (error, info) {
                console.log('Message sent: %s', info && info.messageId ? info.messageId : error);
                // Preview only available when sending through an Ethereal account
                if (!error)
                    // console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
                    callback(info && info.messageId ? info : { error: 'error mail failure' });
                // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@blurdybloop.com>
                // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
            });
        });
    };
    Emailer.prototype.contactPromise = function (email, callback) {
        this.send(email, function (res) {
            var respond = res;
            if (respond && respond.messageId) {
                // fulfilled
                callback({ info: respond.messageId });
            }
            else {
                var rejected = new Error('Message could not sent ');
                console.log(rejected);
                callback({ error: rejected });
            }
            console.log("contactPromise: ", respond);
        });
    };
    return Emailer;
}());
exports.Emailer = Emailer;
