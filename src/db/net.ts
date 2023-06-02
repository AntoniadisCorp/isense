// Clever-Cloud Mongo DB
// technicaldb: mongodb://ucrabeksjkigvz9:lijaIRixg4xgEZrBMPKj@brghyzdzarocacc-mongodb.services.clever-cloud.com:27017/brghyzdzarocacc
// dbsense: mongodb://ubzlzzwppunqupgw7dom:mu3QZXHCkgGAT2pdK8ip@b2h3trm37hg6zta-mongodb.services.clever-cloud.com:27017/b2h3trm37hg6zta


/* import { connect, connection, Connection, set } from 'mongoose'; */
import { MongoClient, MongoClientOptions, Collection, Db, MongoError } from 'mongodb';
import { mongoUri, mongoCFG, dbName, memobj, dbobj, memjs } from './serverconfig/netselector';


/* 
import {
  Device, DeviceModel, Category, Cate_prod,
  CategoryModel, Cate_prodModel, Product, ProductModel
} from './models' */

// import assert = require('assert');



/* declare interface IModels {

  Category: CategoryModel;
  Cate_prod: Cate_prodModel;
  Product: ProductModel;
  Device: DeviceModel;
} */

class DB {


  private static instance: DB;

  private static client: MongoClient;
  private readonly mongoUri = mongoUri;
  private readonly dbName = dbName;

  private static CountConnections: number = 0;
  //   private _models: IModels;

  private constructor() {



    /*  this._models = {
         Category: new Category('category').model,
         Cate_prod: new Cate_prod('cate_prod').model,
         Product: new Product('product').model,
         Device: new Device('device').model
         // this is where we initialise all models
     } */
  }

  // Open the MongoDB connection.
  public static async connect(Uri?: string, CFG?: MongoClientOptions) {

    console.log(`Trying connect(${++this.CountConnections}) to MongoDB..`)

    if (!DB.instance) {

      DB.instance = new DB();
    }

    try {

      console.info(`Connecting to MongoDB Uri: ${!Uri ? mongoUri : Uri} at ${dbobj._common}`);

      DB.client = await MongoClient.connect(!Uri ? mongoUri : Uri, CFG ? CFG : mongoCFG);

      console.info(`MongoDB Connected!`);

    } catch (error) {

      console.log('error during connecting to MongoDB: ');
      console.error(error);
    }
  }

  public static isConnected(): boolean {
    return (!!DB.client)
  }

  // Close the existing connection.
  public static async disconnect(): Promise<void | Error> {

    if (DB.client) {
      return DB.client.close()
    } else {
      console.error('On MongoDB closing: client is undefined\n')
      return new MongoError('DB client is undefined')
    }
  }

  public static getDB(db?: string): Db | undefined {

    if (!DB || !DB.client)
      return

    return DB.client.db(db ? db : DB.instance.dbName)
  }

  public static getCollection(collections: string, db?: string): Collection {

    return DB.client.db(db ? db : DB.instance.dbName).collection(collections)
  }
}

/* DB.Models.Category.mapReduce(
    MapReduceOfCategories,
    (err:any, res: any) => {
        console.log('Map Reduce Running...: ', res)
    }
  ) */

/**
 *  Redis, Kafka, and other kind of Db caching..  
 *  
 **/

import { RedisClientOptions } from './serverconfig/serverOptions';
import { createClient, RedisClient, ClientOpts } from 'redis';
import makeLibraryDb from './library-db';
import makeBookDb from './book-db';

interface MemCacheConnectStatus {

  status: string;
  cb: RedisClient;
  message?: string;
}

class MemCache {

  private client!: RedisClient;

  constructor() { }

  public connect(reconnectAfter?: number, options?: ClientOpts): MemCacheConnectStatus {

    console.log(`Trying connect to ... ${memobj.dbname} at ${memobj._comment}`)

    // DataBase Redis for MiddleWare Caching
    this.client = createClient(options ? options : RedisClientOptions(memobj.host, memobj.port, memobj.password));

    this.client.on('connect', () => {
      console.log('Redis connected!'/* , memobj._subscription */)
    })

    this.client.on('error', (error) => {
      console.log((new Date()) + 'Redis: disconnected!', error)

      // case reconnect after set
      if (typeof reconnectAfter === 'number' && reconnectAfter > 0 && reconnectAfter <= 3) {

        setTimeout(this.connect, reconnectAfter);

      } else return { status: 'error', cb: undefined, message: `${error}` }

    })

    process.on('exit', async () => {


      await dbDisconnect(this.client)
    });

    process.on('SIGINT', async () => {


      await dbDisconnect(this.client)
    });

    return { status: 'ok', cb: this.client }
  }
}

async function dbDisconnect(client: { quit: () => any; }) {
  const stats: any = await DB.getDB()?.stats()
  DB.disconnect()
    ///@ts-ignore
    .then(v => { if (DB.client !== undefined) console.log(`${JSON.stringify(stats)} MongoDB connections closed from ${JSON.stringify(stats?.db)}`); })
    .catch((error: MongoError) => {
      console.error(error);
    })
    .finally(() => {

      if (client.quit()) console.log('Redis connections closed')
      process.exit(200)
    })
}


// makeDb()
// Check DB Connection
export async function makeDb() {

  // trying to reconnect
  if (DB === undefined || !DB.isConnected())
    await DB.connect(mongoUri, mongoCFG)

  return DB.getDB(dbName)
}

const LibraryDB = makeLibraryDb({ makeDb })
const BookDB = makeBookDb({ makeDb })


export { DB, MemCache, memjs, mongoCFG, LibraryDB, BookDB }
