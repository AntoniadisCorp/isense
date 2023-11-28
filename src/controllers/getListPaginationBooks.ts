import { Request } from 'express';
import { OptionEntry } from '../interfaces';

export default function makeListPaginationBook({ paginationBooks }: any) {
    return async function getPaginationBook(httpRequest: Request): Promise<OptionEntry> {


        const headers = {
            'Content-Type': 'application/json'
        }
        try {

            // find for firstname and lastname and mobile
            const { pageNumber, count, pageSize, books } = await paginationBooks({
                query: httpRequest.query
            })

            return {
                headers,
                code: 200,
                status: 'success',
                data: {
                    result: books,
                    current: pageNumber,
                    pages: Math.ceil(count / pageSize),
                    count,
                    message: ``
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
