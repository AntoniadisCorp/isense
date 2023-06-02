import { FindCursor } from 'mongodb';
import { gbr } from '../global';
import id from '../Id'

export default function makeLibraryDb({ makeDb }: any) {
  return Object.freeze({
    findAll,
    /* findByHash,
    findById,
    findByPostId,
    findReplies,
    insert,
    remove,
    update */
  })

  async function findAll({ filter = '', col = 'library' } = {}) {

    const db = await makeDb()
    // const query = publishedOnly ? { published: true } : {}
    const
      fil = filter || '',
      SKU = fil,
      collectionName: string = col

    if (SKU) SKU.replace(/\D/g, '')

    const regex2 = Number(SKU),
      regex = new RegExp(gbr.escapeRegex(filter), 'gi')

    let query =
      (filter === '') ? { recyclebin: false } : {
        $or: [/* { $text: { $search: regex.source }, }, */
          { 'name': { $regex: regex } }, { 'SKU': regex2 }, { 'whatnot': { $regex: regex } }], recyclebin: false
      }


    const result: FindCursor<any> = await db.collection(collectionName).find(query)

    return (await result.toArray()).map(({ _id: id, ...found }): any => ({
      id,
      ...found
    }))
  }
  /* async function findById({ id: _id }) {
    const db = await makeDb()
    const result = await db.collection('comments').find({ _id })
    const found = await result.toArray()
    if (found.length === 0) {
      return null
    }
    const { _id: id, ...info } = found[0]
    return { id, ...info }
  }
  async function findByPostId({ postId, omitReplies = true }) {
    const db = await makeDb()
    const query = { postId: postId }
    if (omitReplies) {
      query.replyToId = null
    }
    const result = await db.collection('comments').find(query)
    return (await result.toArray()).map(({ _id: id, ...found }) => ({
      id,
      ...found
    }))
  }
  async function findReplies({ commentId, publishedOnly = true }) {
    const db = await makeDb()
    const query = publishedOnly
      ? { published: true, replyToId: commentId }
      : { replyToId: commentId }
    const result = await db.collection('comments').find(query)
    return (await result.toArray()).map(({ _id: id, ...found }) => ({
      id,
      ...found
    }))
  }
  async function insert({ id: _id = Id.makeId(), ...commentInfo }) {
    const db = await makeDb()
    const result = await db
      .collection('comments')
      .insertOne({ _id, ...commentInfo })
    const { _id: id, ...insertedInfo } = result.ops[0]
    return { id, ...insertedInfo }
  }

  async function update({ id: _id, ...commentInfo }) {
    const db = await makeDb()
    const result = await db
      .collection('comments')
      .updateOne({ _id }, { $set: { ...commentInfo } })
    return result.modifiedCount > 0 ? { id: _id, ...commentInfo } : null
  }
  async function remove({ id: _id }) {
    const db = await makeDb()
    const result = await db.collection('comments').deleteOne({ _id })
    return result.deletedCount
  }
  async function findByHash(comment) {
    const db = await makeDb()
    const result = await db.collection('comments').find({ hash: comment.hash })
    const found = await result.toArray()
    if (found.length === 0) {
      return null
    }
    const { _id: id, ...insertedInfo } = found[0]
    return { id, ...insertedInfo }
  } */
}
