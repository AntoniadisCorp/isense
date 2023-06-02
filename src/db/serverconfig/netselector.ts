
import * as jdb from '../netconfig/connect.json'
import * as memjs from '../netconfig/connectRedis.json';

let dbArray: Array<string> = ['local', 'Atlas', 'mLab', 'Clever', 'Azure']
let memArray: Array<string> = ['RedisCache', 'local'];

const local = 'local'

// MongoDb db Name, JSON file indexing
const dbjsonIndex = dbArray.indexOf(local),
    dbobj = jdb[dbjsonIndex],

    // Redis Cloud JSON file Indexing
    memjsonIndexOf = (memArray: Array<string>, RedisIndex: any) => memArray.indexOf(RedisIndex),


    memobj = memjs[memjsonIndexOf(memArray, local)],

    dbName = dbobj.dbname,
    mongoUri = jdb[dbjsonIndex].mongoUri + '/' + dbName,
    mongoCFG = jdb[dbjsonIndex].mongoCFG

export { mongoUri, mongoCFG, dbName, memobj, dbobj, memjs, jdb }