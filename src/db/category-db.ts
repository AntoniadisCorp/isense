import { Db, FindCursor, InsertOneResult, ObjectId } from 'mongodb';
import { gbr } from '../global';
import Id from '../Id'
import { ICategory } from '../interfaces';

export default function makeCategoryDb({ makeDb }: any) {
  return Object.freeze({
    findAll,
    findById,
    /* findByHash,
    
    findByPostId,
    findReplies,
    remove,
    update */
    insert,
  })

  async function findAll({ filter = '', col = 'category' } = {}) {

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

  async function findById({ id }: any) {
    const db = await makeDb()
    const result = await db.collection('category').findOne({ _id: id })
    const found = await result.toArray()
    if (found.length === 0) {
      return null
    }
    const { _id, ...info } = found[0]
    return { _id, ...info }
  }

  /*
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

  async function insert({ _id: id = Id.makeId(), ...categoryInfo }: ICategory) {

    const db: Db = await makeDb()
    const result: InsertOneResult<Document> =
      await db
        .collection('category')
        .insertOne({ _id: new ObjectId(id), ...categoryInfo })

    return { _id: id, ...categoryInfo }
  }
}
