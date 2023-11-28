import { ObjectId } from "mongodb"
import { gbr } from "../global"

export default function makePageBooks({ BookDB }: any) {
    return async function paginationBooks({ query }: any = {}) {


        if (!query) {
            throw new Error('You must supply a query.')
        }

        const refField: string = query.refField ? JSON.parse(query.refField) : '' || ''
        const extrafilters: any = refField.length > 0 ? refField : [{}]

        const
            filter = query.filter || '',
            _id = query._id || null,
            SKU = query.SKU || filter,
            sortActive = query.sortActive || '',
            sortOrder = query.sortOrder || '',
            pageNumber = parseInt(query.pageNumber) || 1,
            pageSize = parseInt(query.pageSize) || 10,
            collectionName: string = query.col

        console.log(`Start search in ${collectionName} by ${filter}`)


        if (SKU) SKU.replace(/\D/g, '')

        const sortDirection = sortOrder && sortOrder === 'asc' ? 1 : -1
        let objSort: { [x: string]: any } = {}

        if (sortActive && sortActive !== '')
            objSort[sortActive] = sortDirection

        const sort = sortOrder && sortOrder !== '' ? objSort : { _id: -1 }

        const regex2 = Number(SKU),
            regex = new RegExp(gbr.escapeRegex(filter), 'gi')

        console.log(`search in ${collectionName} by ${filter} or ${regex2 ? regex2 : ''}, ${regex.source}`, query.refField)

        if (extrafilters.length && extrafilters[0].categoryId)
            extrafilters[0].categoryId = new ObjectId(extrafilters[0].categoryId as string)

        let queryParam: any =
            (filter === '') ? {
                $and: extrafilters,
                recyclebin: false
            } : {
                $or: [
                    /* { $text: { $search: regex.source }, }, */
                    { 'name': { $regex: regex } },
                    { 'SKU': regex2 },
                    { 'skuid': { $regex: regex } },
                    { 'whatnot': { $regex: regex } },
                    { 'bookshelf': { $regex: regex } },
                ],
                $and: extrafilters,
                recyclebin: false
            }
        if (_id) {
            queryParam._id = new ObjectId(_id)
        }


        const { count, books } = await BookDB.findByPagination({ query: queryParam, sort, pageNumber, pageSize })

        if (!books)
            throw new Error('cannot retrieve data of the table')// 505 db error



        return { pageNumber, count, pageSize, books }
    }
}