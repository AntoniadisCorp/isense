import { ObjectId } from 'mongodb'
import { makeCategory } from '../entities'
import { ICategory } from '../interfaces'
import { addHierarchyCategory } from '../entities/category'

export function makeAddCategory({ categoryDB }: any) {
    return async function addCategory(categoryInfo: ICategory) {


        let newobj: any = {}
        newobj = categoryInfo
        newobj.tree = []
        newobj.date_added = categoryInfo.date_added
        if (newobj.parentId) newobj.parentId = new ObjectId(categoryInfo.parentId)
        // const category = makeCategory(categoryInfo)
        // const exists = await categoryDB.findByHash({ hash: comment.getHash() })
        // if (exists) {
        //     return exists
        // }


        // const moderated = await handleModeration({ comment })
        // const categorySource = moderated.getSource()

        const { _id, ...insertedInfo } = await categoryDB.insert({ newobj })

        /*  author: moderated.getAuthor(),
            createdOn: moderated.getCreatedOn(),
            hash: moderated.getHash(),
            id: moderated.getId(),
            modifiedOn: moderated.getModifiedOn(),
            postId: moderated.getPostId(),
            published: moderated.isPublished(),
            replyToId: moderated.getReplyToId(),
            source: {
                ip: commentSource.getIp(),
                browser: commentSource.getBrowser(),
                referrer: commentSource.getReferrer()
            },
            text: moderated.getText() */
        if (categoryInfo.parentId)
            addHierarchyCategory(new ObjectId(_id), newobj.parentId)

        return { _id, ...insertedInfo }


    }
}