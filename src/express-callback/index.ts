import { NextFunction, Request, Response } from 'express'
import { OptionEntry } from '../interfaces'
import { log } from '../logger/log'

// set Headers and methods
function setHttpRequest(req: Request, headers: any) {
    return {
        body: req.body,
        query: req.query,
        params: req.params,
        ip: req.ip,
        method: req.method,
        path: req.path,
        headers
    }
}

function setCORS(req: Request) {


    return {
        'Access-Control-Allow-Origin': 'http://localhost:4200',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, X-Auth-Token, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Credentials': 'true',
        'Content-Type': req.get('Content-Type'),
        'Referer': req.get('referer'),
        'User-Agent': req.get('User-Agent'),

    }
}
export const makeExpressCallback = (controller: any) => {

    return async (req: Request, res: Response, next: NextFunction) => {

        const httpRequest = {
            body: req.body,
            query: req.query,
            params: req.params,
            ip: req.ip,
            method: req.method,
            path: req.path,
            headers: {
                'Access-Control-Allow-Origin': 'http://localhost:4200',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, X-Auth-Token, Authorization',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
                'Access-Control-Allow-Credentials': 'true',
                'Content-Type': req.get('Content-Type'),
                'Referer': req.get('referer'),
                'User-Agent': req.get('User-Agent'),
            }
        }
        log(`TEST ------ makeExpressCallback`)
        // const headers = setCORS(req)

        controller(httpRequest)
            .then((httpResponse: OptionEntry) => {

                if (httpResponse.headers) {
                    res.set(httpResponse.headers)
                }


                res.type('json')

                res.status(httpResponse.code).send(httpResponse)
            })
            // will print stacktrace production error handler no stacktraces leaked to user
            .catch((e: Error) => res.status(500).send({ error: 'An unkown error occurred. on controller.' + e.message }))
    }
}

export const makeServerCallback = (controller: any) => {

    return async (req: Request, res: Response, next: NextFunction) => {

        const headers = setCORS(req)
        controller(req, setHttpRequest(req, headers))
            .then((httpResponse: OptionEntry) => {

                if (httpResponse.headers)
                    res.set({ ...headers, ...httpResponse.headers })


                res.type('html')

                return res.status(httpResponse.code).render(httpResponse.view ?? 'index', httpResponse.data)
            })
            .catch((e: Error) => {
                return res.status(500).render('error', { error: 'An unkown error occurred. on controller.' + e.message })
            })

    }
}
