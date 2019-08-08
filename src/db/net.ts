// Clever-Cloud Mongo DB
// technicaldb: mongodb://ucrabeksjkigvz9:lijaIRixg4xgEZrBMPKj@brghyzdzarocacc-mongodb.services.clever-cloud.com:27017/brghyzdzarocacc
// dbsense: mongodb://ubzlzzwppunqupgw7dom:mu3QZXHCkgGAT2pdK8ip@b2h3trm37hg6zta-mongodb.services.clever-cloud.com:27017/b2h3trm37hg6zta


import { connect, connection, Connection } from 'mongoose';
import { Product, ProductModel } from './models/product'
import jdb from './netconfig/connect.json'
import { Device, DeviceModel, Category, Cate_prod, 
    CategoryModel, Cate_prodModel } from './models'

let dbArray: Array<string> = [ 'Atlas', 'mLab', 'Clever', 'Azure' ]

// db Name, and index
let dbjsonIndex = dbArray.indexOf('Atlas'),
    dbname = jdb[dbjsonIndex].dbname

const mongoUri = jdb[dbjsonIndex].mongoUri + '/' + dbname,
      mongoCFG = jdb[dbjsonIndex].mongoCFG

console.log(dbname)



declare interface IModels {
  Category: CategoryModel;
  Cate_prod: Cate_prodModel;
  Product: ProductModel;
  Device: DeviceModel;
}

class DB {

  private static instance: DB;
  
  private _db: Connection; 
  private _models: IModels;

  private constructor() {
      connect(mongoUri, mongoCFG);
      this._db = connection;
      this._db.on('open', this.connected);
      this._db.on('error', this.error);
      this._db.on('close', this.disconnect);

      this._models = {
          Category: new Category('category').model,
          Cate_prod: new Cate_prod('cate_prod').model,
          Product: new Product('product').model,
          Device: new Device('device').model
          // this is where we initialise all models
      }
  }

  public static get Models() {
      if (!DB.instance) {
          DB.instance = new DB();
      }
      return DB.instance._models;
  }

  private connected() {

      console.log( `Mongoose has connected to ${dbname}`);
  }

  private disconnect() {
      console.log( `Mongoose has disconnected from ${dbname}` );
  }

  private error(error:any) {
      console.log('Mongoose has errored', error);
  }
}


export { DB, jdb }
