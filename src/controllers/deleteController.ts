export default function makeDeleteController(removeModel: (arg0: { id: any }) => any) {
  return async function deleteModel(httpRequest: { params: { id: any } }) {
    const headers = {
      'Content-Type': 'application/json'
    }
    try {
      const deleted = await removeModel({ id: httpRequest.params.id })
      return {
        headers,
        code: deleted.deletedCount === 0 ? 404 : 200,
        status: deleted.deletedCount === 0 ? 'error' : 'success',
        data: { result: deleted, message: '' }
      }
    } catch (e: any) {
      // TODO: Error logging
      console.log(e)
      return {
        headers,
        code: 400,
        status: 'error',
        data: {
          error: e.message
        }
      }
    }
  }
}
