// Clever-Cloud Mongo DB
// technicaldb: mongodb://ucrabeksjkigvz9:lijaIRixg4xgEZrBMPKj@brghyzdzarocacc-mongodb.services.clever-cloud.com:27017/brghyzdzarocacc
// dbsense: mongodb://ubzlzzwppunqupgw7dom:mu3QZXHCkgGAT2pdK8ip@b2h3trm37hg6zta-mongodb.services.clever-cloud.com:27017/b2h3trm37hg6zta


/* import { connect, connection, Connection, set } from 'mongoose'; */
import { MongoClient, connect, MongoClientOptions, Collection, Db, MongoError } from 'mongodb';
import jdb from './netconfig/connect.json'
import { Device, DeviceModel, Category, Cate_prod, 
    CategoryModel, Cate_prodModel, Product, ProductModel } from './models'
import assert = require('assert');

let dbArray: Array<string> = [ 'Atlas', 'mLab', 'Clever', 'Azure' ]

// db Name, and index
let dbjsonIndex = dbArray.indexOf('Atlas'),
dbName = jdb[dbjsonIndex].dbname

export const mongoUri = jdb[dbjsonIndex].mongoUri + '/' + dbName,
             mongoCFG = jdb[dbjsonIndex].mongoCFG

console.log(dbName)



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
//   private _models: IModels;
  
  private constructor() {

      /* set('debug', true); */
      /* this._db = connection;
      this._db.on('open', this.connected);
      this._db.on('error', this.error);
      this._db.on('close', this.disconnect); */

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
        // return new Promise<any>(async (resolve, reject) => {
            console.log('Connecting to mongodb');
            if (!DB.instance) {
                DB.instance = new DB();
            }
            try {
                if (!DB.client) {
                    console.info(`Connecting to Uri: ${Uri? Uri : mongoUri}`);
                    DB.client = await MongoClient.connect(Uri? Uri : mongoUri, CFG? CFG : mongoCFG);
                    console.info(`Connected to Mongodb!`);
                }
            } catch(error) {
                console.log('error during connecting to mongo: ');
                console.error(error);
            }  
        // });          
    }

    public static isConnected(): boolean {
      return (!!DB.client)
    }

   // Close the existing connection.
   public static disconnect() {

        if (DB.client) {
            console.log( `Mongoose has disconnected from ${DB.getDB().databaseName}` );
            DB.client.close()
            .then()
            .catch((error:MongoError) => {
                console.error(error);
            });
        } else {
            console.error('close: client is undefined');
        }            
    }

  public static getDB(db?: string): Db {
    
    return DB.client.db(db? db : DB.instance.dbName)
  }
  public static getCollection (collections: string, db?: string ): Collection {

    return DB.client.db(db? db : DB.instance.dbName).collection(collections)
  }
}

/* DB.Models.Category.mapReduce(
    MapReduceOfCategories,
    (err:any, res: any) => {
        console.log('Map Reduce Running...: ', res)
    }
  ) */
  
export { DB, jdb }
