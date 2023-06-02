export default async function notFound() {
  return {
    headers: {
      'Content-Type': 'application/json'
    },
    code: 404,
    status: 'error',
    data: { error: 'Not found.' },
  }
}
