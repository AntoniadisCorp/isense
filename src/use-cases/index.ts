// import makeAddComment from './add-comment'
// import makeEditComment from './edit-comment'
// import makeRemoveComment from './remove-comment'
import makeListLibraries from './listLibraries'
import { makeListBooks, makeListBooksBySKU } from './listBooks'
import makePageBooks from './listPageBooks';
// import makeHandleModeration from './handle-moderation'
import { LibraryDB, BookDB, categoryDB } from '../db'
import { makeAddCategory } from './addCategory';
import makeRemoveCategory from './remCategory';
// import isQuestionable from '../is-questionable'

/* const handleModeration = makeHandleModeration({
  isQuestionable,
  initiateReview: async () => {} // TODO: Make real initiate review function.
}) */
// const addComment = makeAddComment({ commentsDb, handleModeration })
// const editComment = makeEditComment({ commentsDb, handleModeration })
const listLibrary = makeListLibraries({ LibraryDB })
const listBook = makeListBooks({ BookDB })
const listBookBySKU = makeListBooksBySKU({ BookDB })
const paginationBooks = makePageBooks({ BookDB })


const addCategory = makeAddCategory({ categoryDB })
const remCategory = makeRemoveCategory({ categoryDB })

const libraryService = Object.freeze({
  //   addComment,
  //   editComment,
  //   handleModeration,
  listBook,
  listBookBySKU,
  listLibrary,
  paginationBooks,

  addCategory,
  remCategory,
})

export default libraryService
export {

  // router get controller
  paginationBooks, listLibrary, listBook, listBookBySKU,

  // router post controller
  addCategory,
  remCategory,
}
