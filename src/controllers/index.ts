import {
    listLibrary,
    listBook,
    // addComment,
    // editComment,
    // removeComment
} from '../use-cases'

import notFound from './notFound'
import makeGetLibrary from './getLibrary'
import makeGetBook from './getBook'
// import makeDeleteController from './deleteController'
// import makePostComment from './post-comment'
// import makePatchComment from './patch-comment'

// const deleteController = makeDeleteController(removeModel)
const getLibrary = makeGetLibrary({ listLibrary }) // SearchByFilter
const getBook = makeGetBook({ listBook })

const globalController = Object.freeze({
    // deleteController,
    getLibrary,
    getBook,
    notFound
})

export default globalController
export { notFound, getLibrary, getBook }