export default function makeListLibraries({ LibraryDB }: any) {
    return async function listLibrary({ filter, col }: any = {}) {
        if (!filter || !col) {
            throw new Error(`You must supply a filter ${filter} and col ${col}.`)
        }
        const lib = await LibraryDB.findAll({
            filter,
            col
        })
        // const nestedComments = nest(comments)
        return lib

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