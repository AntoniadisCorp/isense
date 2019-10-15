import passport = require("passport");
export const randtoken = require('rand-token')

export const jsonStatusError = {
    "error": {
    "errors": [
    {
        "domain": "global",
        "reason": "required",
        "message": "Login Required",
        "locationType": "header",
        "location": "Authorization"
    }
    ],
    "code": 401,
    "message": "Login Required"
    }
}

// We are assuming that the JWT will come in the header Authorization but it could come in the req.body or in a query param, you have to decide what works best for you.
export const getTokenFromHeader = (req: any) => {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        return req.headers.authorization.split(' ')[1];
    }
}

export const isAuth = (req: any, res: any, next: any) => {


    console.log('User Session req auth ', req && req.user ? req.user : 'req.user node defined');

    console.log(`auth session passport ${req.isAuthenticated()}`, req.session.passport);

    // Cookies that have not been signed
    console.error(`req.signedCookies ${req.sessionID}`, req.signedCookies)
    console.error(`req.cookies`,  req.cookies)

    
    // let isAuthenticated = () => req.session.passport && req.session.passport.user? true : false

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated()) return next();    
    else return res.status(401).json(jsonStatusError);
}


export const isJwtAuth = (req: any, res: any, next: any) => {

    return passport.authenticate('jwt', { session: false }, (err, jwtPayload) =>{

        if (err || !jwtPayload)
        return res.status(401).json(jsonStatusError);

        // if user is authenticated in the session, carry on
        const token = getTokenFromHeader(req)
        console.error(`JWT TOKEN FROM HEADER auth: `)

        console.error(`req.signedCookies ${req.sessionID}`, req.signedCookies)
        console.error(`req.cookies`,  req.cookies)
        
        // if user is authenticated in the session, carry on
        if (token) return next();
    })(req, res, next)
}

export const isBearerAuthenticated = passport.authenticate('jwt-bearer', {session: false});