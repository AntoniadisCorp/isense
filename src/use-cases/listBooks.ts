import chalk from "chalk"
import { ObjectId } from "mongodb"

export default function makeListBooks({ BookDB }: any) {
    return async function listBook({ id, ...changes }: any = {}) {

        if (!id)
            throw new Error('You must supply an id.')

        id = ObjectId.isValid(id) ? new ObjectId(id) : Number(id)
        const exceptFields = changes.exceptFields ? JSON.parse(changes.exceptFields) : {}
        let updated: any = {};
        const existing = await BookDB.findById({ id, col: changes.col, exceptFields })

        if (existing.bookcase && existing.bookcase._id) {

            // updated = await BookDB.findBookshelfNo({})
        }

        // const nestedComments = nest(comments)
        return { ...existing, ...updated }

        // If this gets slow introduce caching.
        /* function nest(comments) {
            if (comments.length === 0) {
                return comments
            }
            return comments.reduce((nested, comment) => {
                comment.replies = comments.filter(
                    reply => reply.replyToId === comment.id
                )
                nest(comment.replies)
                if (comment.replyToId == null) {
                    nested.push(comment)
                }
                return nested
            }, [])
        } */
    }
}