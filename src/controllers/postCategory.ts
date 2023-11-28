import { Request } from "express"
import { ICategory, OptionEntry } from "../interfaces"
import { ObjectId } from "mongodb"

export function makePostCategory({ addCategory }: any): any {
    return async function postCategory(httpRequest: Request): Promise<OptionEntry> {
        try {
            const { ...categoryInfo }: ICategory = httpRequest.body.data as ICategory
            /* source.ip = httpRequest.ip
            source.browser = httpRequest.headers['User-Agent']

            if (httpRequest.headers['Referer']) {
                source.referrer = httpRequest.headers['Referer']
            } */

            const posted: ICategory = await addCategory({ categoryInfo })

            return {
                headers: {
                    'Content-Type': 'application/json',
                    'Last-Modified': new Date(posted.date_modified).toUTCString()
                },
                code: 201,
                status: 'Created',
                data: { result: posted, message: 'Category created ' }
            }
        } catch (e: any) {
            // TODO: Error logging
            console.log(e)

            return {
                headers: {
                    'Content-Type': 'application/json'
                },
                code: 400,
                status: 'Bad request on posting Category',
                data: {
                    error: e.message
                }
            }
        }
    }
}

export function makeDeleteCategory({ remCategory }: any) {
    return async function deleteCategory(httpRequest: Request) {
        const headers = {
            'Content-Type': 'application/json'
        }
        try {

            const id = ObjectId.isValid(httpRequest.params.id) ? new ObjectId(httpRequest.params.id) :
                Number(httpRequest.params.id)
            const deleted = await remCategory({ id })
            const markDeleted = deleted.deletedCount === 0
            return {
                headers,
                code: markDeleted ? 404 : 200,
                body: { result: deleted, message: markDeleted ? 'Category is not deleted' : 'Category deleted' }
            }
        } catch (e: any) {
            // TODO: Error logging
            console.log(e)
            return {
                headers,
                code: 400,
                status: 'Bad request on Category deletion',
                body: {
                    error: e.message
                }
            }
        }
    }
}