
import jdb from '../netconfig/connect.json'
import memjs from '../netconfig/connectRedis.json';

let dbArray: Array<string> = ['local', 'Atlas', 'mLab', 'Clever', 'Azure']
let memArray: Array<string> = ['RedisCache', 'local'];

const local = 'local'

// MongoDb db Name, JSON file indexing
const dbjsonIndex = dbArray.indexOf(local)
const dbobj: any = jdb[dbjsonIndex]

// Redis Cloud JSON file Indexing
const memjsonIndexOf = (memArray: Array<string>, RedisIndex: any) => memArray.indexOf(RedisIndex)


const memobj = memjs[memjsonIndexOf(memArray, local)]

const dbName = '' + jdb[dbjsonIndex].dbname
const mongoUri = jdb[dbjsonIndex].mongoUri + '/' + dbName
const mongoCFG = jdb[dbjsonIndex].mongoCFG;

export { mongoUri, mongoCFG, dbName, memobj, dbobj, memjs, jdb }