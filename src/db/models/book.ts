import { ObjectId, Collection, InsertOneResult, UpdateResult, ModifyResult } from 'mongodb';
import { ImageDef, storagePath, AVATAR_DEFAULT_DIR, AVATAR_DEFAULT_LINK, fileImgError, ExpressMulterFile, IMAGE_DEFAULT_DIR } from './image';
import { UploadedFile, FileArray } from 'express-fileupload';
import { OptionEntry, shiftRsortNo, shiftRByKey, STORAGE_DEFAULT_DIR, shiftLsortNo } from '../../global';
import { DB } from '../net';

import chalk from 'chalk'

interface Dimension {

    x: number
    y: number
}

export interface BookCase {
    _id?: string;
    skuid: string;
    name: string;
    type: number;
    whatnot: string;
    bookshelf: string;
    categories?: Array<{ _id: string | ObjectId, name: string }>
    books?: {
        count: number,
        arrIndex: Array<{ _id: string | ObjectId, bookshelfNo: number }>
    }
    desc: string,
    date_added?: Date;
    date_modified?: Date;
    imageUrl?: string;
    disabled: boolean;
    recyclebin?: boolean;
}

interface BCase {
    _id: ObjectId | string,
    whatnot: string,
    bookshelf: string,
    bookshelfNo?: number
}

export interface Book {

    _id?: ObjectId | string
    SKU: number
    name: string
    libraryId: ObjectId | string
    categoryId?: ObjectId | string
    bookcase: BCase
    author?: string
    publisher?: string
    year?: number
    pages?: number
    volume?: number
    version?: number
    dimensions: Dimension
    isbn10: string
    isbn13: string
    status: string
    notes: string
    avatar: ImageDef
    date_added: Date
    date_modified: Date | null
    recyclebin: boolean
}

export function setBook(reqBody: any, avatarFile: UploadedFile | null): Book {

    // create book Object
    let book: Book = {
        // _id: new ObjectId(reqBody._id),
        SKU: Number(reqBody.SKU),
        name: reqBody.title,
        bookcase: {
            // get _id of bookcase Table
            _id: new ObjectId(reqBody.bookcaseId),
            whatnot: reqBody.whatnot,
            bookshelf: reqBody.bookshelf,
            // bookshelfNo: bookshelfNo + 1,
        },
        author: reqBody.author,
        publisher: reqBody.publisher,
        year: Number(reqBody.year),
        pages: Number(reqBody.pages),
        volume: Number(reqBody.volume),
        version: Number(reqBody.version),
        categoryId: new ObjectId(reqBody.categoryId),
        libraryId: new ObjectId(reqBody.libraryId),
        dimensions: {
            x: Number(reqBody.x),
            y: Number(reqBody.y),
        },
        isbn10: reqBody.isbn10,
        isbn13: reqBody.isbn13,
        status: reqBody.status,
        notes: reqBody.notes,
        avatar: {
            src: !avatarFile ? '' : AVATAR_DEFAULT_LINK + avatarFile.name,
            storageUrl: storagePath(avatarFile, STORAGE_DEFAULT_DIR + AVATAR_DEFAULT_DIR),
            file: avatarFile ? avatarFile : { data: Buffer.alloc(1) }, // remove binary file data
        },
        date_added: new Date(),
        date_modified: null,
        recyclebin: false
    }

    return book
}

export function upBook(formData: any, avatarFile: UploadedFile | null, path: string): Book {

    // console.log('formData: ', formData)
    const avatarForm = {
        src: formData.src,
        storageUrl: formData.storageUrl,
        file: {
            name: formData.name,
            data: formData.data,
            size: Number(formData.size),
            encoding: formData.encoding,
            tempFilePath: formData.tempFilePath,
            truncated: Boolean(formData.truncated),
            mimetype: formData.mimetype,
            md5: formData.md5,
        }
    }
    const src: string = !avatarFile ? avatarForm.src : AVATAR_DEFAULT_LINK + avatarFile.name
    const storageUrl: string = !avatarFile ? avatarForm.storageUrl : path

    // create book Object
    const book: any = {
        // _id: new ObjectId(formData._id),
        SKU: Number(formData.SKU),
        name: formData.title,
        bookcase: {
            // get _id of bookcase Table
            _id: new ObjectId(formData.bookcaseId),
            whatnot: formData.whatnot,
            bookshelf: formData.bookshelf,
            // bookshelfNo: Number(formData.bookshelfNo) + 1,
        },
        author: formData.author,
        publisher: formData.publisher,
        year: Number(formData.year),
        pages: Number(formData.pages),
        volume: Number(formData.volume),
        version: Number(formData.version),
        categoryId: new ObjectId(formData.categoryId),
        libraryId: new ObjectId(formData.libraryId),
        dimensions: {
            x: Number(formData.x),
            y: Number(formData.y),
        },
        isbn10: formData.isbn10,
        isbn13: formData.isbn13,
        status: formData.status,
        notes: formData.notes,
        avatar: {
            src,
            storageUrl,
            file: avatarFile ? avatarFile : storageUrl && storageUrl.length > 0 ? avatarForm.file : { data: Buffer.alloc(1) },
        },
        date_modified: new Date(),
        recyclebin: false
    }


    // remove binary file data
    book.avatar.file.data = Buffer.alloc(1)

    // console.log('avatar: ', book.avatar)

    return book
}

export async function getBookFromDb(_id: ObjectId | number, col: string, exceptFields: object) {

    const dbCollection: Collection = DB.getCollection(String(col))

    console.log(chalk.whiteBright('get Book from DB "col": ', chalk.underline(String(col)) + '!'))

    const filter: any = {
        _id,
        recyclebin: false
    }

    let book: any | null = await dbCollection.findOne(filter, exceptFields)


    if (!book) {
        return ({ code: 500, status: 'DbError', error: book })
    }

    if (book.bookcase && book.bookcase._id) {

        // Logger
        console.log(chalk.bold.red('get BookCase from DB "col": ', chalk.underline(String(col)) + '!'))

        // Look for BookshelfNo Number
        let bcase = await getBookshelfNo(book.bookcase._id as string, book._id as string)

        // cannot find any result 
        if (!bcase || !bcase.books) {
            return ({ code: 500, status: 'DbError', error: bcase })
        }

        // pop bookshlefNo from arrIndex Queue
        let shelf: { _id: ObjectId | string, bookshelfNo: number } | undefined = bcase.books.arrIndex.pop()

        // update bookcase attribute of book collection
        book.bookcase.bookshelfNo = shelf ? shelf.bookshelfNo : shelf
    }

    return {
        code: 200,
        status: 'success',
        data: {
            result: book,
            message: 'Το βιβλίο το βρέθηκε επιτυχώς'
        }
    }

}

export async function saveBookInDb(files: FileArray | undefined | null, reqBody: any): Promise<OptionEntry> {

    if (fileImgError(files)) return ({ code: 404, status: 'imageError', error: 'No files were uploaded.' })

    let file: ExpressMulterFile = <ExpressMulterFile>files

    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    const avatarFile: UploadedFile | null = file ? file.avatar : null

    // console.log(avatarFile, jsonObj)

    const storageUrl = storagePath(avatarFile, STORAGE_DEFAULT_DIR + AVATAR_DEFAULT_DIR)

    console.log(`storageUrl: `, storageUrl)
    if (avatarFile) {
        avatarFile.mv(storageUrl)
            /* .then() */
            .catch((err: any) => {
                if (err) return ({ code: 404, status: 'imageError', error: err })
            });
    }

    let bookshelfNo: number = Number(reqBody.bookshelfNo > 0 ? reqBody.bookshelfNo : 0)

    let book: any = setBook(reqBody, avatarFile)

    let dbCollection: Collection = DB.getCollection(reqBody.col);

    // insert Book to NoSQL DB
    let skuDuplicate: any = await dbCollection.find({ SKU: book.SKU }, { projection: { "SKU": 1 } })


    if (skuDuplicate)
        return ({
            code: 500, status: 'DbFailed',
            data: { result: skuDuplicate, message: `Διπλότυπη εγγραφή με κωδικό SKU βιβλίου ${book.SKU} στη συλλογή ${reqBody.col}` }
        })

    let bookWrite: any = await dbCollection.insertOne(book)

    if (bookWrite.result && !!bookWrite.result.ok) {

        let bookCaseWrite: OptionEntry = await upBookcaseArrIndex(bookWrite.insertedId, reqBody.bookcaseId, bookshelfNo)
        /* .then() */
        // .catch((err: any) => { return ({ code: 500, status: 'DbError', error: err }) })
        return bookCaseWrite
    }


    return ({ code: 500, status: 'DbFailed', data: { result: bookWrite, message: `Cannot insert in ${reqBody.col} Collection` } })
    // `File uploaded to ${storageUrl} successful! `
}

export async function updateBookinDB(files: FileArray | undefined | null, formData: any): Promise<OptionEntry> {

    if (fileImgError(files)) return ({ code: 404, status: 'imageError', error: 'No files were uploaded.' })

    let file: ExpressMulterFile = <ExpressMulterFile>files

    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    const avatarFile: UploadedFile | null = file ? file.avatar : null

    // console.log(avatarFile, jsonObj)

    const storageUrl = storagePath(avatarFile, STORAGE_DEFAULT_DIR + AVATAR_DEFAULT_DIR)

    console.log(`storageUrl: `, storageUrl)
    if (avatarFile) {
        avatarFile.mv(storageUrl)
            /* .then() */
            .catch((err: any) => {
                if (err) return ({ code: 404, status: 'imageError', error: err })
            })
    }

    // 
    let bookshelfNo: number = Number(formData.bookshelfNo >= 0 ? formData.bookshelfNo : 0)

    // 
    let oldbookshelfNo: number = Number(formData.oldbookshelfNo >= 0 ? formData.oldbookshelfNo : null)

    // 
    let book: Book = upBook(formData, avatarFile, storageUrl)

    // console.log(formData._id)
    // 
    const bookId: ObjectId = new ObjectId(formData._id)

    // 
    const dbCollection: Collection = DB.getCollection(formData.col)

    // 
    const ks: UpdateResult = await dbCollection.updateOne({ _id: bookId }, { $set: book })

    // console.log(bookId, `${bookshelfNo} ${oldbookshelfNo}`)

    if (ks && !!ks.acknowledged) {

        let bookCaseWrite: OptionEntry = await upBookcaseArrIndex2(bookId, formData.bookcaseId, bookshelfNo, oldbookshelfNo)

        return bookCaseWrite
    }

    return ({ code: 500, status: 'DbFailed', data: { result: ks, message: `Cannot insert in ${formData.col} Collection` } })


}

async function upBookcaseArrIndex(bookId: ObjectId, bookcaseId: string, bookshelfNo: number): Promise<OptionEntry> {


    const dbCollectionbook: Collection = DB.getCollection('bookcase')
    const _id = new ObjectId(bookcaseId)

    let bookcase: any = await dbCollectionbook.findOne({ _id }, { projection: { 'books': 1 } })

    if (!bookcase) {
        return ({ code: 500, status: 'DbError', error: bookcase })
    }

    if (bookcase.books && bookcase.books.count == bookshelfNo) {

        return appendToNextBookcase(_id, bookId, bookcase.books.count + 1)
    }
    //  `File uploaded to ${storageUrl} successful! `
    else return appendBookAnywhere(bookId, bookcase, _id, bookshelfNo)
}

async function upBookcaseArrIndex2(bookId: ObjectId, bookcaseId: string, bookshelfNo: number, oldbookshelfNo: number): Promise<OptionEntry> {

    const dbCollectionbook: Collection = DB.getCollection('bookcase')
    // {'books.arrIndex._id': ObjectId('5eb17eed3ea49331186f3fce') }
    // Remove bookId from arrIndex in Bookcase Collection
    const bookcase: any = await dbCollectionbook.updateOne(
        { 'books.arrIndex._id': bookId },
        {
            $pull: { 'books.arrIndex': { _id: bookId } },  // remove Item
            $inc: { 'books.count': -1 }, // decrement by arrayFilters bookshelfNo field from index of item that removes
            $currentDate: { lastModified: true },
        }, /* { returnOriginal: false }, */
    )

    // console.log(bookcase.value, bookId)
    // const bookcase: any = await dbCollectionbook.findOne({ _id: new ObjectId(formData.bookcaseId) }, { fields: { 'books': 1 } })

    if (!bookcase && !!bookcase!.ok) {
        return ({ code: 500, status: 'DbError', error: bookcase })
    }

    let newBookcase: { books: { count: number, arrIndex: Array<{ _id: string, bookshelfNo: number }> } } = bookcase.value
    let booksCount: number = 0;

    if (newBookcase) {
        booksCount = newBookcase.books.count
        shiftLsortNo(newBookcase.books.arrIndex, oldbookshelfNo)
    }


    if (!newBookcase || booksCount == bookshelfNo) {

        return appendToNextBookcase(new ObjectId(bookcaseId), bookId, booksCount + 1)

    } else return appendBookAnywhere(bookId, newBookcase as BookCase, new ObjectId(bookcaseId), bookshelfNo)

    /* shiftRsortNo(newBookcase.books.arrIndex, bookshelfNo)

    shiftRByKey(newBookcase.books.arrIndex, bookshelfNo, {
        _id, bookshelfNo: bookshelfNo + 1
    })

    console.log('arrIndex: ', newBookcase.books.arrIndex)

    dbCollectionbook.updateOne({ _id: new ObjectId(bookcaseId) },
        {
            $currentDate: { date_modified: true },
            $set: { 'books.arrIndex': newBookcase.books.arrIndex },
            $inc: { 'books.count': 1 },

        }, (err: any, result: any) => {

            if (err) return ({ code: 500, status: 'DbError', error: err })

            return ({
                code: 200,
                status: 'success',
                data: {
                    result,
                    message: `File uploaded to ${path} successful! `
                }
            })
        }) */




}

async function appendToNextBookcase(_id: ObjectId, bookId: ObjectId, bookshelfNo: number) {


    // append to next book-case
    let upBookcase: any = await DB.getCollection('bookcase').updateOne({ _id },
        {
            $currentDate: { date_modified: true },
            $inc: { 'books.count': 1 },
            $push: {
                'books.arrIndex': {
                    _id: bookId, bookshelfNo
                }
            }
        })

    if (!upBookcase) return ({ code: 500, status: 'DbError', error: upBookcase })

    return {
        code: 200,
        status: 'success',
        data: {
            result: upBookcase.result,
            message: ''
        }
    }
}

async function appendBookAnywhere(bookId: ObjectId, bookcase: BookCase, bookcaseId: ObjectId,
    bookshelfNo: number): Promise<OptionEntry> {

    if (!bookcase.books) {
        return ({ code: 500, status: 'DbFailed', error: 'bookcase books array does not exist' })
    }

    shiftRsortNo(bookcase.books.arrIndex, bookshelfNo)

    shiftRByKey(bookcase.books.arrIndex, bookshelfNo, {
        _id: bookId, bookshelfNo: bookshelfNo + 1
    })

    // console.log('arrIndex: ', bookcase.books.arrIndex)

    // const dbCollectionbook: Collection = DB.getCollection('bookcase')


    let upBookcase: any = await DB.getCollection('bookcase').updateOne({ _id: bookcaseId },
        {
            $currentDate: { date_modified: true },
            $set: { 'books.arrIndex': bookcase.books.arrIndex },
            $inc: { 'books.count': 1 },

        })

    if (!upBookcase.result.ok) return ({ code: 500, status: 'DbFailed', error: upBookcase.result })

    return {
        code: 200,
        status: 'success',
        data: {
            result: upBookcase.result,
            message: ''
        }
    }

}


async function getBookshelfNo(bookcaseId: string, bookId: string): Promise<BookCase | null> {

    let bcase: any | null = await DB.getCollection('bookcase')
        .findOne(
            { _id: new ObjectId(bookcaseId), 'books.arrIndex._id': new ObjectId(bookId) },
            { projection: { 'books.arrIndex.$bookshelfNo': 1 } }
        )
    return bcase
}

