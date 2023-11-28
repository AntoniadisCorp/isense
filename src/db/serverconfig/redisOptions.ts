import { RedisStoreOptions } from "connect-redis"


const NodeSetSessionOptions = (secret: string, genid: string, store: RedisStoreOptions): object => {

    return Object.freeze({
        secret,
        genid: (req: Request) => {
            return genid // use UUIDs for session IDs
        },
        saveUninitialized: true,
        resave: false,
        // using store session on Redis using express-session + connect
        store,
        cookie: { secure: true, httponly: true, maxAge: 3600000 }, // Note that the cookie-parser module is no longer needed
        cookieName: '__UDRD',
        duration: 30 * 60 * 1000,
        activeDuration: 5 * 60 * 1000,
        ephemeral: true
    })
}

const RedisClientOptions = (host: string, port: number, password?: string): object => {
    return Object.freeze({
        port,               // replace with your port
        host,        // replace with your hostanme or IP address
        password,    // replace with your password
        // optional, if using SSL
        // use `fs.readFile[Sync]` or another method to bring these values in
        // tls       : {
        //   key  : stringValueOfKeyFile,  
        //   cert : stringValueOfCertFile,
        //   ca   : [ stringValueOfCaCertFile ]
        // }
    })
}

export { NodeSetSessionOptions, RedisClientOptions }