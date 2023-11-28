import {
    listLibrary,
    listBook,
    paginationBooks,
    listBookBySKU,



    addCategory,
    // editCategory,
    remCategory,

    // editComment,
    // removeComment
} from '../use-cases'

import notFound from './notFound'
import makeGetLibrary from './getLibrary'
import { makeGetBook, makeGetBookBySKU } from './getBook'
import makeListPaginationBook from './getListPaginationBooks';
import { makePostCategory, /* makePatchCategory, makeDelCategory  */ makeDeleteCategory } from './postCategory';

// import makePostComment from './post-comment'
// import makePatchComment from './patch-comment'


const getLibrary = makeGetLibrary({ listLibrary }) // SearchByFilter
const getBook = makeGetBook({ listBook })
const getBookBySKU = makeGetBookBySKU({ listBookBySKU })
const getPaginationBook = makeListPaginationBook({ paginationBooks })

// Post for Category Class
const postCategory = makePostCategory({ addCategory })
// const patchCategory = makePatchCategory({ editCategory })
const delCategory = makeDeleteCategory({ remCategory })


const globalController = Object.freeze({
    // deleteController,
    getLibrary,

    getBook,
    getPaginationBook,
    getBookBySKU,

    // Posts for Categories
    postCategory,
    // patchCategory,
    delCategory,


    notFound
})

// 
// Export Default Controller
// 
export default globalController
export {

    getLibrary,

    getBook,
    getPaginationBook,
    getBookBySKU,

    // Posts for Categories
    postCategory,
    // patchCategory,
    delCategory,


    notFound,
}