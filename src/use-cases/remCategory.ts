import { makeCategory } from "../entities"

export default function makeRemoveCategory({ categoryDB }: any) {
    return async function removeCategory({ id }: any = {}) {
        if (!id) {
            throw new Error('You must supply a category id.')
        }

        const categoryToDelete = await categoryDB.findById({ _id: id })

        if (!categoryToDelete) {
            return deleteNothing()
        }

        if (await hasReplies(categoryToDelete)) {
            return softDelete(categoryToDelete)
        }

        if (await isOnlyReplyOfDeletedParent(categoryToDelete)) {
            return deleteCategoryAndParent(categoryToDelete)
        }

        return hardDelete(categoryToDelete)
    }


    async function hasReplies({ id: categoryId }: any) {
        const replies = await categoryDB.findReplies({
            categoryId,
            publishedOnly: false
        })
        return replies.length > 0
    }

    async function isOnlyReplyOfDeletedParent(category: any) {
        if (!category.replyToId) {
            return false
        }
        const parent = await categoryDB.findById({ id: category.replyToId })
        if (parent && makeCategory(parent).isDeleted()) {
            const replies = await categoryDB.findReplies({
                commentId: parent.id,
                publishedOnly: false
            })
            return replies.length === 1
        }
        return false
    }

    function deleteNothing() {
        return {
            deletedCount: 0,
            softDelete: false,
            message: 'Category not found, nothing to delete.'
        }
    }

    async function softDelete(categoryInfo: any) {
        const toDelete = makeCategory(categoryInfo)
        toDelete.markDeleted()

        await categoryDB.update({
            id: toDelete.getId(),
            name: toDelete.getName(),
            desc: toDelete.getDesc(),
            tree: toDelete.getTree(),
            parentId: toDelete.getParentId()
        })
        return {
            deletedCount: 1,
            softDelete: true,
            message: 'Comment has replies. Soft deleted.'
        }
    }

    async function deleteCategoryAndParent(category: any) {
        await Promise.all([
            categoryDB.remove(category),
            categoryDB.remove({ _id: category.replyToId })
        ])
        return {
            deletedCount: 2,
            softDelete: false,
            message: 'Comment and parent deleted.'
        }
    }

    async function hardDelete(category: any) {
        await categoryDB.remove(category)
        return {
            deletedCount: 1,
            softDelete: false,
            message: 'Comment deleted.'
        }
    }
}