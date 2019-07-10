
import nodemailer from 'nodemailer'
const email = require('emailjs')
const acc = {
    user: 'info@technicalprb.com',
    host: 'uk3.fcomet.com',
    pass: 'For(Life!=0)',
    port: 25,
    secure: true
}

class Emailer {

    private server: any

    constructor () {

        
        this.server = email.server.connect({
            user:	acc.user, 
            password: acc.pass, 
            host: acc.host,
            port: acc.port,
            _secure: acc.secure,
        });
     
    }

   emailjs (mailOptions: any) {
      
        let message	= {
            text:	mailOptions.text, 
            from:	mailOptions.from, 
            to:		mailOptions.to,
            // cc:		"else <else@your-email.com>",
            subject:	mailOptions.subject,
            /* attachment: 
            [
              {data:"<html>i <i>hope</i> this works!</html>", alternative:true},
              {path:"path/to/file.zip", type:"application/zip", name:"renamed.zip"}
            ] */
        }

        
        // send the message and get a callback with an error or details of the message that was sent
        this.server.send(message, (err: any, message: string) => { 
            let out = err || message

            console.log('emailjs ', out); 
            return !err? { info: out } : { error: out }
        });
    }

    send (emailContainer:any, callback?:any) {

      // Generate test SMTP service account from ethereal.email
      // Only needed if you don't have a real mail account for testing
      nodemailer.createTestAccount((err:any, account:any) => {
        
            // create reusable transporter object using the default SMTP transport
            let transporter = nodemailer.createTransport({
                host: acc.host,
                port: 465,
                // pool: true,
                secure: acc.secure, // true for 465, false for other ports
                requireTLS: true,
                auth: {
                    user: acc.user, // generated ethereal user
                    pass: acc.pass  // generated ethereal password
                },
                tls: {
                    // do not fail on invalid certs
                    rejectUnauthorized: false
                }
            });

            // setup email data with unicode symbols
            let mailOptions = {
                from: `"${emailContainer.name}. 👻" <${emailContainer.email}>`, // sender address
                to: acc.user, // list of receivers , prokopis123@gmail.com
                subject: `${emailContainer.subject} ✔ Page Form`, // Subject line
                text: `${emailContainer.message}`, // plain text body
                html: `<b>${emailContainer.message}</b>` // html body
            };
        
            // send mail with defined transport object
            transporter.sendMail(mailOptions, (error:any, info:any) => {
                

                console.log('Message sent: %s', info&&info.messageId? info.messageId : error);
                // Preview only available when sending through an Ethereal account
                if (!error)
                    // console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
                
                callback (info&&info.messageId? info : {error: 'error mail failure'})
                // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@blurdybloop.com>
                // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
            });
        });
    }

    contactPromise (email:any, callback?:any) {

        this.send(email, (res: any) => {

            let respond = res
            if (respond && respond.messageId) {
                // fulfilled
                callback({info:respond.messageId})
            } else {
                let rejected = new Error( 'Message could not sent ');
                console.log(rejected)
                callback({error: rejected})
            } console.log(`contactPromise: `, respond)
        })
        
       
    }

}

export { Emailer }