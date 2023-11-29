import chalk from 'chalk';
import { Collection, Db, FindCursor, ObjectId } from 'mongodb';
import { gbr } from '../global';
import id from '../Id'
import { log } from '../logger/log';

export default function makeBookDb({ makeDb }: any) {
  return Object.freeze({
    // findAll,
    findById,
    findByPagination,
    findBySKU,
    /* findByHash,
    findByPostId,
    findReplies,
    insert,
    remove,
    update */
  })

  // async function findAll({ filter = '', col = 'library' } = {}) {

  //     const db = await makeDb()
  //     // const query = publishedOnly ? { published: true } : {}
  //     const
  //         fil = filter || '',
  //         SKU = fil,
  //         collectionName: string = col

  //     if (SKU) SKU.replace(/\D/g, '')

  //     const regex2 = Number(SKU),
  //         regex = new RegExp(gbr.escapeRegex(filter), 'gi')

  //     let query =
  //         (filter === '') ? { recyclebin: false } : {
  //             $or: [/* { $text: { $search: regex.source }, }, */
  //                 { 'name': { $regex: regex } }, { 'SKU': regex2 }, { 'whatnot': { $regex: regex } }], recyclebin: false
  //         }


  //     const result: FindCursor<any> = await db.collection(collectionName).find(query)

  //     return (await result.toArray()).map(({ _id: id, ...found }): any => ({
  //         id,
  //         ...found
  //     }))
  // }

  // getBookFromDb
  async function findById({ id: _id, col, exceptFields }: any) {
    const db: Db = await makeDb()

    // log('get Book from DB "col": ', chalk.underline(String(col)) + '!'))
    const book = await db.collection(String(col)).findOne({ _id }, exceptFields)

    if (!book) {
      return null // or ({ code: 500, status: 'DbError', error: book })
    }

    const { _id: id, ...info } = book
    return { id, ...info }
  }

  async function findByPagination({ query, sort, pageNumber, pageSize }: any) {
    const db: Db = await makeDb()

    log('search Book from DB "col": ', chalk.underline(String(query.col)) + '!')

    const books: any[] = await db.collection('book').find(query)
      .sort(sort)
      .skip((pageSize * pageNumber) - pageSize)
      .limit(pageSize)
      .toArray()

    if (!books) {
      return null
    }

    let myArray: any[] = books.map<any>(v => new ObjectId(v._id))

    let k: any = await db.collection('bookcase').find({
      'books.arrIndex._id': { $in: books.map<ObjectId>(v => new ObjectId(v._id)) },
    }, {
      projection: { 'books.arrIndex': 1 }
    })

    k.forEach((item: any) => {

      let myarray2: any[] = item.books.arrIndex
      myArray.forEach((element, i) => {
        const index = myarray2.findIndex(v => element.equals(v._id))
        if (index > -1) books[i].bookcase.bookshelfNo = myarray2[index].bookshelfNo
      }) // console.log(item, item.books.arrIndex)
    })
    // count documents in book db
    const count: number = await db.collection('book').countDocuments(query, {})

    // const { _id: id, ...info } = book
    return { count, books }
  }


  async function findBySKU({ SKU = {} }) {


    const db = await makeDb()

    const result = await db.getCollection('book').find(SKU, { projection: { SKU: 1 } }).min({ SKU: 0 }).max({ SKU: 1000 }).hint({ SKU: 1 })

    return (await result.limit(100).toArray())
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
