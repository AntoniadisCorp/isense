// import makeAddComment from './add-comment'
// import makeEditComment from './edit-comment'
// import makeRemoveComment from './remove-comment'
import makeListLibraries from './listLibraries'
import makeListBooks from './listBooks'
// import makeHandleModeration from './handle-moderation'
import {LibraryDB, BookDB} from '../db'

// import isQuestionable from '../is-questionable'

/* const handleModeration = makeHandleModeration({
  isQuestionable,
  initiateReview: async () => {} // TODO: Make real initiate review function.
}) */
// const addComment = makeAddComment({ commentsDb, handleModeration })
// const editComment = makeEditComment({ commentsDb, handleModeration })
const listLibrary = makeListLibraries({ LibraryDB })
const listBook = makeListBooks({ BookDB })
// const removeComment = makeRemoveComment({ commentsDb })

const libraryService = Object.freeze({
  //   addComment,
  //   editComment,
  //   handleModeration,
  listBook,
  listLibrary,
  //   removeComment
})

export default libraryService
export {/*  addComment, editComment, */ listLibrary, listBook/*  removeComment */ }
