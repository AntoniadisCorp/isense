import { NextFunction, Request, Response } from 'express'
import { OptionEntry } from '../global'

// set Headers and methods

export const makeExpressCallback = (controller: any) => {

    return async (req: Request, res: Response, next: NextFunction) => {

        // if (req.session && !req.session!.views) {
        // }
        const httpRequest: any = {
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
                Referer: req.get('referer'),
                'User-Agent': req.get('User-Agent'),
            }
        }

        console.log(`TEST ------ makeExpressCallback`)

        controller(httpRequest)
            .then((httpResponse: OptionEntry) => {

                if (httpResponse.headers) {
                    // console.log(httpResponse.headers)
                    res.set(httpResponse.headers)
                }
                res.type('json')

                // res.statusMessage = httpResponse.status
                res.status(httpResponse.code).send(httpResponse)
            })
            .catch((e: any) => res.status(500).send({ error: 'An unkown error occurred. on controller' }))
    }
}

