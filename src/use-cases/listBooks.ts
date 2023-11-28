import chalk from "chalk"
import { ObjectId } from "mongodb"
import { getMinMax, missNoArray } from "../global"

export function makeListBooks({ BookDB }: any) {
    return async function listBook({ id, ...changes }: any = {}) {

        if (!id)
            throw new Error('You must supply an id.')

        id = ObjectId.isValid(id) ? new ObjectId(id) : Number(id)
        const exceptFields = changes.exceptFields ? JSON.parse(changes.exceptFields) : {}
        let updated: any = {};

        const existing = await BookDB.findById({ id, col: changes.col, exceptFields })

        if (existing.bookcase && existing.bookcase._id) {

            // updated = await BookDB.findBookshelfNo({})
        }
        return { ...existing, ...updated }
    }
    function removeByteOrderMark(str: string) {
        return str.replace(/^\ufeff/g, "")
    }
}


export function makeListBooksBySKU({ BookDB }: any) {
    return async function listBookBySKU({ SKU }: any = {}) {


        const existing = await BookDB.findBySKU({ SKU })

        if (existing) {
            let SKU: number[] = existing.map((v: { SKU: any }) => v.SKU)

            let no = getMinMax(missNoArray(SKU)),
                minMax = getMinMax(SKU).max

            no.min ? no.min : minMax >= 0 ? minMax + 1 : 0 /* arrayToTree(categories, {
            parentProperty: 'parentId',
            customID: '_id'
        }) */

            return no
        } else return {}
    }

}