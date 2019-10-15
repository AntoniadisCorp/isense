import { Request, Response, Handler, NextFunction, RequestHandler } from "express";
import { DB, MemCache } from "../db";
import { Client, Code, Token, SECRET } from "../db/models";
import { randtoken } from "../global";
import { Collection } from "mongodb";
import { ObjectId } from "bson";
import jwt from 'jsonwebtoken'

// Load required packages
const oauth2orize = require('oauth2orize'),
      login = require('connect-ensure-login')


class Auth2 {

    public static server: any
    private static instance: Auth2;

    constructor() {}


    private StartServerAuth2orize() {

        Auth2.server = oauth2orize.createServer()
        if (Auth2.server) console.log('oauth2orize server started..')

        // Register serialialization function
        Auth2.server.serializeClient((client: Client, done: any) => { return done(null, client._id) })
        
        // Register deserialization function
        Auth2.server.deserializeClient((id: any, done: any) => {
            const Redisclient = new MemCache().connect(15000).cb
            Redisclient.hmget('client', `${id}`, (err: any, client: any) => {
                if (err) { Redisclient.quit(); return done(err); }
                console.log('deserialized', JSON.parse(client))
                Redisclient.quit()
                return done(null, client);
            })
            
        });


        // Register authorization code grant type
        Auth2.server.grant(oauth2orize.grant.code( (client: Client, 
            redirectUri: any, user: any, ares: any, done: any) => {

            try {
    
                // Check DB Connection
                if (!DB.isConnected()) { // trying to reconnect
                    DB.connect();
                } else{

                    console.log('Creating a new authorization code...', user)
                    const dbCollection: Collection = DB.getCollection('code'),
                        // Create a new authorization code
                        code: Code = {
                            value: randtoken.uid(256),
                            clientId: client._id,
                            redirectUri: redirectUri,
                            userId: client.userId
                        }

                    // Save the auth code and check for errors
                    dbCollection
                        .save( code )
                        .then((rr:any) => {
                            return done(null, code.value);
                        }).catch( (err: any) => {
                            return done(err); 
                        });
                } 
            } catch (error) {
                return done(error); 
            }
        }));

        Auth2.server.exchange(oauth2orize.exchange.code((client: Client, code: string,
            redirectUri: any, done: any) =>  {

                try {
    
                    // Check DB Connection
                    if (!DB.isConnected()) { // trying to reconnect
                        DB.connect();
                    } else{

                        const dbCollection: Collection = DB.getCollection('code')

                        dbCollection
                            .findOne({ value: code })
                            .then( (authCode: Code) => {

                                if (!authCode) { return done(null, false); }
                                if (client._id.toString() !== authCode.clientId) { return done(null, false); }
                                if (redirectUri !== authCode.redirectUri) { return done(null, false); }
    
                                // Delete auth code now that it has been used
                                dbCollection
                                    .remove( authCode )
                                    .then( () => {
                                        
                                        const dbCollection: Collection = DB.getCollection('token'),                                            
                                        // Create a new access token
                                        token: Token = {
                                            value: randtoken.uid(256),
                                            clientId: authCode.clientId,
                                            userId: authCode.userId
                                        }
                                        
                                        // Save the access token and check for errors
                                        dbCollection
                                            .save( token )
                                            .then( () => {
                                                // var enctoken = jwt.encode(token, SECRET);
                                                const enctoken = jwt.sign(token, SECRET, { expiresIn: 600 });
                                                return done(null, enctoken);
                                            })
                                            .catch( (err: any) => { if (err) { return done(err); }
                                        });
                                    })
                                    .catch( (err: any) => { if(err) { return done(err); }
                                });
                            }).catch( (err) => { return done(err) })
                    }
                } catch (error) {
                    return done(error); 
                }
        }));
    }

    static getInstance(): any  {

        if (!Auth2.instance) {
            Auth2.instance = new Auth2();
        }

        return Auth2.instance
    }

    static getAutorization () {

        return Auth2.instance.authorization()
    }

    static getDecision () {

        return Auth2.instance.decision()
    }

    static getToken () {

        return Auth2.instance.token()
    }

    private authorization (): RequestHandler[] {

        if (!Auth2.server) { console.log('oauth2orize not running..') }

        return [
                login.ensureLoggedIn('/ServiceLogin'),
                Auth2.server.authorization((clientId: string, redirectUri: string, done: any) => {
                    try {

                        // Check DB Connection
                        if (!DB.isConnected()) { // trying to reconnect
                            DB.connect();
                        } else { 

                            const dbCollection: Collection = DB.getCollection('client')

                            // if not exist create one and send back
                            dbCollection
                                    .findOne({ _id: new ObjectId(clientId) })
                                    .then(( client: Client) => {
                                    
                                        if (!client) return done(null, false, redirectUri);

                                        return done(null, client, redirectUri);
                                    })
                                    .catch( (err: any) => {if (err) { return done(err); } })
                        }
                    } catch ( err ) {
                        return done(err)
                    }
                }),
                (req: any, res: Response) => {
                    console.log(req.oauth2);
                    
                    res.render('dialog', 
                    { transactionId: req.oauth2.transactionID, user: req.user, client: req.oauth2.client });
                        // post to /login
                        // post to /v2/authorize
                }
        ]
    }

    private decision (): RequestHandler[]  {

        return [
            Auth2.server.decision()
          ]
    }

    private token (): RequestHandler[]  {
        
        return [
            Auth2.server.token(),
            Auth2.server.errorHandler()
        ]
    }


}

export { Auth2 }