import crypto from 'crypto'
import id from '../Id'

import buildMakeSource from './source'
import buildMakeCategory from './category'
// import ipRegex from 'ip-regex'

// const makeSource = buildMakeSource({ isValidIp })
// const makeBook = buildMakeBook({ Id, md5, sanitize, makeSource })

const makeCategory = buildMakeCategory({ id, md5 })

const makeEntities = Object.freeze({


    // Posts for Categories
    makeCategory
})


export default makeEntities
export { makeCategory }

function md5(text: string) {
    return crypto
        .createHash('md5')
        .update(text, 'utf-8')
        .digest('hex')
}



// function isValidIp(ip: string) {
//     return ipRegex({ exact: true }).test(ip)
// }
