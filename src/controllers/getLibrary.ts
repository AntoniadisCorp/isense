import { Request } from 'express';
import { log } from '../logger/log';

export default function makeGetLibrary({ listLibrary }: any) {
    return async function getLibrary(httpRequest: Request) {
        const headers = {
            'Content-Type': 'application/json'
        }
        try {
            // find for firstname and lastname and mobile
            log(httpRequest.query.filter)
            const getLibraries = await listLibrary({
                filter: httpRequest.query.filter,
                col: httpRequest.query.col
            })
            return {
                headers,
                code: 200,
                status: 'success',
                data: { result: getLibraries, message: '' }
            }
        } catch (e: any) {
            // TODO: Error logging
            console.log(e)
            return {
                headers,
                code: 400,
                status: 'error',
                data: {
                    error: e.message
                }
            }
        }
    }
}
