import { Request } from 'express';

export function makeGetBook({ listBook }: any) {
    return async function getBookControl(httpRequest: Request) {
        const headers = {
            'Content-Type': 'application/json'
        }
        try {
            // find for firstname and lastname and mobile

            const getBookById = await listBook({
                id: httpRequest.params.id,
                // filter: httpRequest.query.filter,
                col: httpRequest.query.col,
                exceptFields: httpRequest.query.exceptFields
            })
            return {
                headers,
                code: 200,
                status: 'success',
                data: { result: getBookById, message: 'Το βιβλίο Βρήθηκε Επιτυχώς' }
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

export function makeGetBookBySKU({ listBookBySKU }: any) {
    return async function listBookBySKU(httpRequest: Request) {
        const headers = {
            'Content-Type': 'application/json'
        }
        try {


            const skuMinMax: any = await listBookBySKU(httpRequest.body)

            return {
                headers,
                code: 200,
                status: 'success',
                data: {
                    result: skuMinMax, message: 'Το βιβλίο Βρήθηκε Επιτυχώς'
                }
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

